/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  baseCareerPaths,
  baseLearningTasks,
  baseRoadmap,
  emptyProfile,
  initialState,
} from "../data/initialData";
import {
  createApplication,
  fetchApplications,
  fetchJobsFromApi,
  fetchUserProfile,
  loginUser,
  registerUser,
  saveUserProfile,
  sendApplicationSummaryEmail,
  updateApplicationStatusApi,
} from "../services/apiClient";
import {
  APPLY_THRESHOLD,
  calculateMatchScore,
} from "../services/matchingService";
import type {
  ApplicationStatus,
  CareerMithraState,
  JobOpportunity,
  OnboardingProfile,
  TaskStatus,
  UserAccount,
} from "../types";

const STORAGE_KEY = "careermithra-state-v1";

export interface CareerMithraContextValue {
  state: CareerMithraState;
  register: (account: UserAccount) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: (profile: OnboardingProfile) => Promise<void>;
  saveProfileSettings: (profile: OnboardingProfile) => Promise<void>;
  selectCareerPath: (careerId: string) => void;
  updateRoadmapStepStatus: (stepId: string, status: TaskStatus) => void;
  updateResumeText: (resumeText: string) => void;
  applyToOpportunity: (opportunityId: string) => Promise<void>;
  markOpportunityAsApplied: (opportunityId: string) => Promise<void>;
  updateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus,
  ) => Promise<void>;
  addNotification: (message: string) => void;
  refreshJobs: () => Promise<void>;
  jobsLoading: boolean;
}

export const CareerMithraContext = createContext<
  CareerMithraContextValue | undefined
>(undefined);

function computeReadiness(state: CareerMithraState): CareerMithraState {
  const completedMilestones = state.roadmap.filter(
    (step) => step.status === "completed",
  ).length;
  const ongoingTasks = state.roadmap.filter(
    (step) => step.status === "in progress",
  ).length;
  const total = state.roadmap.length || 1;
  const readinessScore = Math.min(
    100,
    Math.round(
      (completedMilestones / total) * 70 + (ongoingTasks / total) * 30,
    ),
  );

  return {
    ...state,
    completedMilestones,
    ongoingTasks,
    readinessScore,
  };
}

function deriveRecommendedCareers(profile: OnboardingProfile) {
  const userSkills = new Set(
    profile.skills.map((skill) => skill.toLowerCase()),
  );

  return [...baseCareerPaths]
    .map((career) => {
      const overlap = career.requiredSkills.filter((skill) =>
        userSkills.has(skill.toLowerCase()),
      ).length;
      return { career, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .map((item) => item.career);
}

function cloneRoadmap() {
  return baseRoadmap.map((step) => ({ ...step }));
}

function cloneLearningTasks() {
  return baseLearningTasks.map((task) => ({ ...task }));
}

function normalizeProfile(profile: unknown): OnboardingProfile {
  const value = (profile || {}) as Record<string, unknown>;
  const skills = Array.isArray(value.skills)
    ? value.skills.filter((item): item is string => typeof item === "string")
    : [];

  return {
    education:
      typeof value.education === "string"
        ? value.education
        : typeof value.academicDetails === "string"
          ? value.academicDetails
          : "",
    skills,
    projects: typeof value.projects === "string" ? value.projects : "",
    achievements:
      typeof value.achievements === "string" ? value.achievements : "",
    experience: typeof value.experience === "string" ? value.experience : "",
    certifications:
      typeof value.certifications === "string" ? value.certifications : "",
    assessmentEnabled: Boolean(value.assessmentEnabled),
    aptitudeScore:
      typeof value.aptitudeScore === "number" ? value.aptitudeScore : undefined,
    personalityType:
      typeof value.personalityType === "string" ? value.personalityType : "",
    resumeText: typeof value.resumeText === "string" ? value.resumeText : "",
  };
}

function normalizeOpportunity(opportunity: unknown): JobOpportunity | null {
  if (!opportunity || typeof opportunity !== "object") {
    return null;
  }

  const value = opportunity as Record<string, unknown>;
  const rawSkills = Array.isArray(value.requiredSkills)
    ? value.requiredSkills
    : [];

  const requiredSkills = rawSkills
    .map((skill) => {
      if (typeof skill === "string") {
        return skill.trim();
      }

      if (skill && typeof skill === "object") {
        const tag = skill as { name?: unknown; short_name?: unknown };
        if (typeof tag.name === "string") return tag.name.trim();
        if (typeof tag.short_name === "string") return tag.short_name.trim();
      }

      return "";
    })
    .filter((skill) => skill.length > 0);

  return {
    id: typeof value.id === "string" ? value.id : `job-${Date.now()}`,
    title: typeof value.title === "string" ? value.title : "Position",
    company: typeof value.company === "string" ? value.company : "Company",
    location: typeof value.location === "string" ? value.location : "India",
    type:
      value.type === "Internship" ||
      value.type === "Job" ||
      value.type === "Opportunity"
        ? value.type
        : "Opportunity",
    requiredSkills,
    description:
      typeof value.description === "string"
        ? value.description
        : "Join our team",
    deadline:
      typeof value.deadline === "string"
        ? value.deadline
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
    applyUrl: typeof value.applyUrl === "string" ? value.applyUrl : undefined,
    source: typeof value.source === "string" ? value.source : undefined,
    postedAt: typeof value.postedAt === "string" ? value.postedAt : undefined,
    publisher:
      typeof value.publisher === "string" ? value.publisher : undefined,
    salary: typeof value.salary === "string" ? value.salary : undefined,
  };
}

function normalizePersistedState(value: unknown): CareerMithraState {
  if (!value || typeof value !== "object") {
    return initialState;
  }

  const raw = value as Partial<CareerMithraState>;
  const normalizedProfile = normalizeProfile(raw.profile);
  const normalizedOpportunities = Array.isArray(raw.opportunities)
    ? raw.opportunities
        .map((opportunity) => normalizeOpportunity(opportunity))
        .filter((opportunity): opportunity is JobOpportunity =>
          Boolean(opportunity),
        )
    : initialState.opportunities;

  return computeReadiness({
    ...initialState,
    ...raw,
    user: raw.user ?? null,
    authToken: raw.authToken ?? null,
    isAuthenticated: Boolean(raw.isAuthenticated),
    onboardingComplete: Boolean(raw.onboardingComplete),
    profile: normalizedProfile,
    recommendedCareers:
      Array.isArray(raw.recommendedCareers) && raw.recommendedCareers.length > 0
        ? raw.recommendedCareers
        : baseCareerPaths,
    selectedCareerId: raw.selectedCareerId ?? null,
    roadmap:
      Array.isArray(raw.roadmap) && raw.roadmap.length > 0
        ? raw.roadmap
        : cloneRoadmap(),
    learningTasks:
      Array.isArray(raw.learningTasks) && raw.learningTasks.length > 0
        ? raw.learningTasks
        : cloneLearningTasks(),
    opportunities:
      normalizedOpportunities.length > 0
        ? normalizedOpportunities
        : initialState.opportunities,
    applications: Array.isArray(raw.applications) ? raw.applications : [],
    notifications: Array.isArray(raw.notifications)
      ? raw.notifications
      : initialState.notifications,
    jobsLoading: Boolean(raw.jobsLoading),
  });
}

export function CareerMithraProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CareerMithraState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    try {
      return normalizePersistedState(JSON.parse(stored));
    } catch {
      return initialState;
    }
  });
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const refreshJobs = useCallback(async () => {
    setJobsLoading(true);
    setState((currentState) => ({
      ...currentState,
      jobsLoading: true,
    }));
    try {
      const realJobs = await fetchJobsFromApi();
      setState((currentState) => ({
        ...currentState,
        opportunities: realJobs,
        jobsLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch real jobs:", error);
      setState((currentState) => ({
        ...currentState,
        jobsLoading: false,
      }));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const syncApplications = useCallback(async (token: string) => {
    try {
      const applications = await fetchApplications(token);
      setState((currentState) => ({
        ...currentState,
        applications,
      }));
    } catch (error) {
      console.error("Failed to sync applications:", error);
    }
  }, []);

  const syncProfile = useCallback(async (token: string) => {
    try {
      const response = await fetchUserProfile(token);
      const profile = response.profile;
      if (response.onboardingComplete && profile) {
        const normalizedProfile = normalizeProfile(profile);
        setState((currentState) => {
          const next = {
            ...currentState,
            onboardingComplete: true,
            profile: normalizedProfile,
            recommendedCareers: deriveRecommendedCareers(normalizedProfile),
          };
          return computeReadiness(next);
        });
      } else {
        setState((currentState) => ({
          ...currentState,
          onboardingComplete: false,
          profile: { ...emptyProfile },
          recommendedCareers: baseCareerPaths,
          selectedCareerId: null,
          roadmap: cloneRoadmap(),
          learningTasks: cloneLearningTasks(),
          completedMilestones: 0,
          ongoingTasks: 0,
          readinessScore: 0,
        }));
      }
    } catch (error) {
      console.error("Failed to sync profile:", error);
    }
  }, []);

  useEffect(() => {
    refreshJobs();

    // Keep jobs fresh for a near real-time experience.
    const interval = window.setInterval(() => {
      refreshJobs();
    }, 120000);

    return () => window.clearInterval(interval);
  }, [refreshJobs]);

  useEffect(() => {
    if (!state.authToken || !state.isAuthenticated) {
      return;
    }

    syncApplications(state.authToken);
    syncProfile(state.authToken);
  }, [state.authToken, state.isAuthenticated, syncApplications, syncProfile]);

  useEffect(() => {
    if (!state.onboardingComplete) {
      return;
    }

    const interval = window.setInterval(() => {
      setState((currentState) => {
        const suggestion =
          currentState.readinessScore < 40
            ? "Take one focused learning sprint this week to improve readiness."
            : "Great momentum. Try applying to one new role this week.";

        return {
          ...currentState,
          notifications: [suggestion, ...currentState.notifications].slice(
            0,
            8,
          ),
        };
      });
    }, 20000);

    return () => window.clearInterval(interval);
  }, [state.onboardingComplete]);

  const register = useCallback(
    async (account: UserAccount) => {
      try {
        const response = await registerUser(account);
        setState((currentState) => ({
          ...currentState,
          user: {
            ...account,
            fullName: response.user.fullName,
            email: response.user.email,
          },
          authToken: response.token,
          isAuthenticated: true,
          onboardingComplete: false,
          profile: { ...emptyProfile },
          recommendedCareers: baseCareerPaths,
          selectedCareerId: null,
          roadmap: cloneRoadmap(),
          learningTasks: cloneLearningTasks(),
          completedMilestones: 0,
          ongoingTasks: 0,
          readinessScore: 0,
          applications: [],
          notifications: [
            `Welcome ${response.user.fullName}. Let us build your career roadmap.`,
          ],
        }));
        await syncApplications(response.token);
        await syncProfile(response.token);
        return true;
      } catch (error) {
        console.error("Registration failed:", error);
        return false;
      }
    },
    [syncApplications, syncProfile],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginUser(email, password);
        setState((currentState) => ({
          ...currentState,
          user: {
            fullName: response.user.fullName,
            email: response.user.email,
            password,
          },
          authToken: response.token,
          isAuthenticated: true,
          onboardingComplete: false,
          profile: { ...emptyProfile },
          recommendedCareers: baseCareerPaths,
          selectedCareerId: null,
          roadmap: cloneRoadmap(),
          learningTasks: cloneLearningTasks(),
          completedMilestones: 0,
          ongoingTasks: 0,
          readinessScore: 0,
          applications: [],
          notifications: [`Welcome back ${response.user.fullName}.`],
        }));
        await syncApplications(response.token);
        await syncProfile(response.token);
        return true;
      } catch {
        return false;
      }
    },
    [syncApplications, syncProfile],
  );

  const logout = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isAuthenticated: false,
      authToken: null,
      applications: [],
    }));
  }, []);

  const completeOnboarding = useCallback(
    async (profile: OnboardingProfile) => {
      const token = state.authToken;

      if (token) {
        try {
          await saveUserProfile(token, profile);
        } catch (error) {
          console.error("Failed to persist onboarding profile:", error);
        }
      }

      setState((currentState) => {
        const next = {
          ...currentState,
          onboardingComplete: true,
          profile,
          recommendedCareers: deriveRecommendedCareers(profile),
          notifications: [
            "Onboarding completed. Review your recommended career paths.",
            ...currentState.notifications,
          ],
        };
        return computeReadiness(next);
      });
    },
    [state.authToken],
  );

  const saveProfileSettings = useCallback(
    async (profile: OnboardingProfile) => {
      const token = state.authToken;

      if (token) {
        try {
          await saveUserProfile(token, profile);
        } catch (error) {
          console.error("Failed to save profile settings:", error);
        }
      }

      setState((currentState) => {
        const next = {
          ...currentState,
          profile,
          recommendedCareers: deriveRecommendedCareers(profile),
          notifications: [
            "Profile settings updated successfully.",
            ...currentState.notifications,
          ].slice(0, 8),
        };

        return computeReadiness(next);
      });
    },
    [state.authToken],
  );

  const selectCareerPath = useCallback((careerId: string) => {
    setState((currentState) => ({
      ...currentState,
      selectedCareerId: careerId,
      notifications: [
        "Career path selected. Your roadmap is now tailored to this track.",
        ...currentState.notifications,
      ],
    }));
  }, []);

  const updateRoadmapStepStatus = useCallback(
    (stepId: string, status: TaskStatus) => {
      setState((currentState) => {
        const next = {
          ...currentState,
          roadmap: currentState.roadmap.map((step) =>
            step.id === stepId ? { ...step, status } : step,
          ),
        };
        return computeReadiness(next);
      });
    },
    [],
  );

  const updateResumeText = useCallback((resumeText: string) => {
    setState((currentState) => {
      const updatedProfile = {
        ...currentState.profile,
        resumeText,
      };

      if (currentState.authToken && currentState.onboardingComplete) {
        saveUserProfile(currentState.authToken, updatedProfile).catch(
          (error) => {
            console.error("Failed to sync resume text:", error);
          },
        );
      }

      return {
        ...currentState,
        profile: updatedProfile,
      };
    });
  }, []);

  const applyToOpportunity = useCallback(
    async (opportunityId: string) => {
      const currentSnapshot = state;
      if (!currentSnapshot.authToken) {
        setState((currentState) => ({
          ...currentState,
          notifications: [
            "Please login again to apply.",
            ...currentState.notifications,
          ],
        }));
        return;
      }

      const target = currentSnapshot.opportunities.find(
        (op) => op.id === opportunityId,
      );
      if (!target) {
        return;
      }

      const exists = currentSnapshot.applications.some(
        (app) => app.opportunityId === opportunityId,
      );
      if (exists) {
        setState((prev) => ({
          ...prev,
          notifications: [
            `Already applied to ${target.title} at ${target.company}.`,
            ...prev.notifications,
          ],
        }));
        return;
      }

      const matchData = calculateMatchScore(currentSnapshot.profile, target);

      if (matchData.score < APPLY_THRESHOLD) {
        setState((prev) => ({
          ...prev,
          notifications: [
            `Low match (${matchData.score}%). Improve skills first: ${matchData.missingSkills.join(", ")}.`,
            ...prev.notifications,
          ],
        }));
        return;
      }

      const payload = {
        opportunityId: target.id,
        title: target.title,
        company: target.company,
        appliedDate: new Date().toISOString().slice(0, 10),
        deadline: target.deadline,
        status: "Applied" as ApplicationStatus,
        followUpReminder: "Follow up in 5 days",
        matchScore: matchData.score,
        matchedSkills: matchData.matchedSkills,
        missingSkills: matchData.missingSkills,
      };

      try {
        const created = await createApplication(
          currentSnapshot.authToken,
          payload,
        );

        if (currentSnapshot.user?.email) {
          try {
            await sendApplicationSummaryEmail({
              toEmail: currentSnapshot.user.email,
              fullName: currentSnapshot.user.fullName,
              jobTitle: target.title,
              company: target.company,
              matchScore: matchData.score,
              matchedSkills: matchData.matchedSkills,
              missingSkills: matchData.missingSkills,
            });
          } catch (emailError) {
            console.error("Failed to send application email:", emailError);
          }
        }

        setState((prev) => ({
          ...prev,
          applications: [created, ...prev.applications],
          notifications: [
            `Strong match (${matchData.score}%)! Applied to ${target.title} at ${target.company}.`,
            ...prev.notifications,
          ],
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          notifications: [
            error instanceof Error
              ? `Application failed: ${error.message}`
              : "Application failed. Please try again.",
            ...prev.notifications,
          ],
        }));
      }
    },
    [state],
  );

  const markOpportunityAsApplied = useCallback(
    async (opportunityId: string) => {
      const currentSnapshot = state;
      if (!currentSnapshot.authToken) {
        setState((currentState) => ({
          ...currentState,
          notifications: [
            "Please login again to update applied jobs.",
            ...currentState.notifications,
          ],
        }));
        return;
      }

      const target = currentSnapshot.opportunities.find(
        (op) => op.id === opportunityId,
      );
      if (!target) {
        return;
      }

      const exists = currentSnapshot.applications.some(
        (app) => app.opportunityId === opportunityId,
      );
      if (exists) {
        return;
      }

      const matchData = calculateMatchScore(currentSnapshot.profile, target);
      const payload = {
        opportunityId: target.id,
        title: target.title,
        company: target.company,
        appliedDate: new Date().toISOString().slice(0, 10),
        deadline: target.deadline,
        status: "Applied" as ApplicationStatus,
        followUpReminder: "Follow up in 5 days",
        matchScore: matchData.score,
        matchedSkills: matchData.matchedSkills,
        missingSkills: matchData.missingSkills,
      };

      try {
        const created = await createApplication(
          currentSnapshot.authToken,
          payload,
        );

        if (currentSnapshot.user?.email) {
          try {
            await sendApplicationSummaryEmail({
              toEmail: currentSnapshot.user.email,
              fullName: currentSnapshot.user.fullName,
              jobTitle: target.title,
              company: target.company,
              matchScore: matchData.score,
              matchedSkills: matchData.matchedSkills,
              missingSkills: matchData.missingSkills,
            });
          } catch (emailError) {
            console.error("Failed to send application email:", emailError);
          }
        }

        setState((prev) => ({
          ...prev,
          applications: [created, ...prev.applications],
          notifications: [
            `${target.title} at ${target.company} moved to Applied Jobs.`,
            ...prev.notifications,
          ],
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          notifications: [
            error instanceof Error
              ? `Could not mark role as applied: ${error.message}`
              : "Could not mark role as applied.",
            ...prev.notifications,
          ],
        }));
      }
    },
    [state],
  );

  const updateApplicationStatus = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      const token = state.authToken;
      if (!token) return;

      try {
        const updated = await updateApplicationStatusApi(
          token,
          applicationId,
          status,
        );
        setState((currentState) => ({
          ...currentState,
          applications: currentState.applications.map((application) =>
            application.id === applicationId ? updated : application,
          ),
        }));
      } catch (error) {
        console.error("Failed to update application status:", error);
      }
    },
    [state.authToken],
  );

  const addNotification = useCallback((message: string) => {
    setState((currentState) => ({
      ...currentState,
      notifications: [message, ...currentState.notifications].slice(0, 8),
    }));
  }, []);

  const value = useMemo<CareerMithraContextValue>(
    () => ({
      state,
      register,
      login,
      logout,
      completeOnboarding,
      saveProfileSettings,
      selectCareerPath,
      updateRoadmapStepStatus,
      updateResumeText,
      applyToOpportunity,
      markOpportunityAsApplied,
      updateApplicationStatus,
      addNotification,
      refreshJobs,
      jobsLoading,
    }),
    [
      state,
      register,
      login,
      logout,
      completeOnboarding,
      saveProfileSettings,
      selectCareerPath,
      updateRoadmapStepStatus,
      updateResumeText,
      applyToOpportunity,
      markOpportunityAsApplied,
      updateApplicationStatus,
      addNotification,
      refreshJobs,
      jobsLoading,
    ],
  );

  return (
    <CareerMithraContext.Provider value={value}>
      {children}
    </CareerMithraContext.Provider>
  );
}
