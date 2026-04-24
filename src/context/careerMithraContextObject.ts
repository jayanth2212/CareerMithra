import { createContext } from "react";
import type {
  ApplicationStatus,
  CareerMithraState,
  OnboardingProfile,
  TaskStatus,
  UserAccount,
} from "../types";

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
