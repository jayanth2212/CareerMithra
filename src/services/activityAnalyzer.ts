import type { CareerMithraState, OnboardingProfile } from "../types";

export interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  lastLogin?: string;
  accountCreated?: string;
  totalApplications: number;
  successfulApplications: number;
  applicationSuccessRate: number;
  profileCompleteness: number;
  careerSelected: boolean;
  selectedCareer?: string;
  learningTasksCompleted: number;
  totalLearningTasks: number;
  milestones: {
    profileCreated?: string;
    firstApplication?: string;
    firstShortlist?: string;
    firstInterview?: string;
    firstSelection?: string;
  };
  engagementScore: number; // 0-100
  status: "active" | "inactive" | "new";
  recentActions: UserActivityLog[];
}

export interface UserActivityLog {
  timestamp: string;
  action: string;
  category: "profile" | "application" | "career" | "learning" | "auth";
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number; // Last 7 days
  avgEngagementScore: number;
  applicationsTrendThisWeek: number;
  successRateOverall: number;
  mostActiveUsers: UserActivity[];
  usersByEngagementLevel: {
    highEngagement: number;
    mediumEngagement: number;
    lowEngagement: number;
  };
  topCareerPaths: { career: string; count: number }[];
  applicationFunnel: {
    applied: number;
    shortlisted: number;
    interviewed: number;
    selected: number;
  };
}

/**
 * Analyze a single user's activity and engagement
 */
export function analyzeUserActivity(state: CareerMithraState): UserActivity {
  const user = state.user;
  if (!user) {
    return {
      userId: "unknown",
      userName: "Unknown User",
      userEmail: "Unknown",
      totalApplications: 0,
      successfulApplications: 0,
      applicationSuccessRate: 0,
      profileCompleteness: 0,
      careerSelected: false,
      learningTasksCompleted: 0,
      totalLearningTasks: 0,
      milestones: {},
      engagementScore: 0,
      status: "inactive",
      recentActions: [],
    };
  }

  // Calculate profile completeness (0-100%)
  const profileCompleteness = calculateProfileCompleteness(state.profile);

  // Count applications and successes
  const totalApplications = state.applications.length;
  const successfulApplications = state.applications.filter(
    (app) => app.status === "Selected" || app.status === "Shortlisted",
  ).length;
  const applicationSuccessRate =
    totalApplications > 0
      ? Math.round((successfulApplications / totalApplications) * 100)
      : 0;

  // Learning progress
  const learningTasksCompleted = state.learningTasks.filter(
    (task) => task.id,
  ).length;
  const totalLearningTasks = state.learningTasks.length || 1;

  // Calculate engagement score (0-100)
  const engagementScore = calculateEngagementScore(state);

  // Determine status
  const status = determineUserStatus(engagementScore, state);

  // Collect recent actions (simulate from state data)
  const recentActions = generateRecentActions(state);

  // Track milestones
  const milestones = extractMilestones(state);

  return {
    userId: user.email, // Use email as unique ID
    userName: user.fullName,
    userEmail: user.email,
    totalApplications,
    successfulApplications,
    applicationSuccessRate,
    profileCompleteness,
    careerSelected: !!state.selectedCareerId,
    selectedCareer: state.selectedCareerId ?? undefined,
    learningTasksCompleted,
    totalLearningTasks,
    milestones,
    engagementScore,
    status,
    recentActions,
  };
}

/**
 * Calculate profile completeness percentage
 */
function calculateProfileCompleteness(profile: OnboardingProfile): number {
  let completed = 0;
  const fields = 8;

  if (profile.education) completed++;
  if (profile.skills && profile.skills.length > 0) completed++;
  if (profile.experience) completed++;
  if (profile.projects) completed++;
  if (profile.certifications) completed++;
  if (profile.resumeText && profile.resumeText.length > 100) completed++;
  if (profile.achievements) completed++;
  if (profile.assessmentEnabled) completed++;

  return Math.round((completed / fields) * 100);
}

/**
 * Calculate user engagement score based on activity
 */
function calculateEngagementScore(state: CareerMithraState): number {
  let score = 0;

  // Profile completeness: 0-30 points
  const profileCompleteness = calculateProfileCompleteness(state.profile);
  score += (profileCompleteness / 100) * 30;

  // Applications: 0-25 points
  const appScore = Math.min(25, state.applications.length * 5);
  score += appScore;

  // Career selection: 10 points
  if (state.selectedCareerId) score += 10;

  // Learning tasks: 0-20 points
  const learningScore = Math.min(
    20,
    (state.learningTasks.length / 5) * 20
  );
  score += learningScore;

  // Roadmap progress: 0-15 points
  const completedMilestones = state.roadmap.filter(
    (step) => step.status === "completed",
  ).length;
  const roadmapScore = Math.min(
    15,
    (completedMilestones / state.roadmap.length) * 15
  );
  score += roadmapScore;

  return Math.round(Math.min(100, score));
}

/**
 * Determine user status based on engagement and time
 */
function determineUserStatus(
  engagementScore: number,
  state: CareerMithraState
): "active" | "inactive" | "new" {
  if (engagementScore >= 60) {
    return "active";
  } else if (engagementScore >= 20) {
    return state.onboardingComplete ? "inactive" : "new";
  } else {
    return "new";
  }
}

/**
 * Extract milestone timestamps from state
 */
function extractMilestones(state: CareerMithraState): Record<string, string> {
  const milestones: Record<string, string> = {};

  // Profile created (use current date as approximation)
  if (state.onboardingComplete) {
    milestones.profileCreated = new Date().toLocaleDateString();
  }

  // First application
  if (state.applications.length > 0) {
    milestones.firstApplication = state.applications[0].appliedDate;
  }

  // First shortlist
  const firstShortlist = state.applications.find(
    (app) => app.status === "Shortlisted"
  );
  if (firstShortlist) {
    milestones.firstShortlist = firstShortlist.appliedDate;
  }

  // First interview
  const firstInterview = state.applications.find(
    (app) => app.status === "Interview"
  );
  if (firstInterview) {
    milestones.firstInterview = firstInterview.appliedDate;
  }

  // First selection
  const firstSelection = state.applications.find(
    (app) => app.status === "Selected"
  );
  if (firstSelection) {
    milestones.firstSelection = firstSelection.appliedDate;
  }

  return milestones;
}

/**
 * Generate recent activity logs (simulated from state)
 */
function generateRecentActions(
  state: CareerMithraState
): UserActivityLog[] {
  const actions: UserActivityLog[] = [];

  // Profile updates
  if (state.onboardingComplete) {
    actions.push({
      timestamp: new Date().toISOString(),
      action: "Completed Profile Setup",
      category: "profile",
      details: `Filled ${calculateProfileCompleteness(state.profile)}% of profile`,
    });
  }

  // Recent applications (last 3)
  state.applications.slice(0, 3).forEach((app) => {
    actions.push({
      timestamp: app.appliedDate,
      action: `Applied to ${app.title} at ${app.company}`,
      category: "application",
      details: `Match Score: ${app.matchScore}%`,
      metadata: {
        company: app.company,
        matchScore: app.matchScore,
        status: app.status,
      },
    });
  });

  // Career selection
  if (state.selectedCareerId) {
    actions.push({
      timestamp: new Date().toISOString(),
      action: "Selected Career Path",
      category: "career",
      details: state.selectedCareerId,
    });
  }

  // Learning task progress
  if (state.learningTasks.length > 0) {
    actions.push({
      timestamp: new Date().toISOString(),
      action: `Engaging with Learning Tasks`,
      category: "learning",
      details: `${state.learningTasks.length} tasks available`,
    });
  }

  return actions.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Generate admin-level analytics across all users (mock multiple users)
 */
export function generateAdminAnalytics(
  currentUserState: CareerMithraState,
  allUsersData?: UserActivity[]
): AdminAnalytics {
  // Simulate multiple users by analyzing current user multiple times
  // In production, you'd aggregate real data from a database
  const mockUsers = allUsersData || [
    analyzeUserActivity(currentUserState),
  ];

  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.status === "active").length;
  const newUsers = mockUsers.filter((u) => u.status === "new").length;
  const avgEngagementScore = Math.round(
    mockUsers.reduce((sum, u) => sum + u.engagementScore, 0) / totalUsers
  );

  // Application funnel
  const totalApps = mockUsers.reduce((sum, u) => sum + u.totalApplications, 0);
  const shortlistedApps = mockUsers.reduce(
    (sum) =>
      sum +
      (currentUserState.applications.filter((a) => a.status === "Shortlisted")
        .length || 0),
    0
  );
  const interviewApps = mockUsers.reduce(
    (sum) =>
      sum +
      (currentUserState.applications.filter((a) => a.status === "Interview")
        .length || 0),
    0
  );
  const selectedApps = mockUsers.reduce(
    (sum) =>
      sum +
      (currentUserState.applications.filter((a) => a.status === "Selected")
        .length || 0),
    0
  );

  const successRateOverall =
    totalApps > 0 ? Math.round(((shortlistedApps + selectedApps) / totalApps) * 100) : 0;

  // Engagement distribution
  const highEngagement = mockUsers.filter((u) => u.engagementScore >= 70).length;
  const mediumEngagement = mockUsers.filter(
    (u) => u.engagementScore >= 40 && u.engagementScore < 70
  ).length;
  const lowEngagement = mockUsers.filter((u) => u.engagementScore < 40).length;

  // Top careers
  const careerMap = new Map<string, number>();
  mockUsers.forEach((u) => {
    if (u.selectedCareer) {
      careerMap.set(u.selectedCareer, (careerMap.get(u.selectedCareer) || 0) + 1);
    }
  });
  const topCareerPaths = Array.from(careerMap.entries())
    .map(([career, count]) => ({ career, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers,
    activeUsers,
    newUsers,
    avgEngagementScore,
    applicationsTrendThisWeek: totalApps,
    successRateOverall,
    mostActiveUsers: mockUsers.sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 5),
    usersByEngagementLevel: {
      highEngagement,
      mediumEngagement,
      lowEngagement,
    },
    topCareerPaths,
    applicationFunnel: {
      applied: totalApps,
      shortlisted: shortlistedApps,
      interviewed: interviewApps,
      selected: selectedApps,
    },
  };
}

/**
 * Get user activity trends over time (mock data)
 */
export function getUserActivityTrends(state: CareerMithraState): {
  date: string;
  applications: number;
  activeUsers: number;
}[] {
  // Simulate weekly trend data
  const trends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      applications: Math.max(
        0,
        state.applications.length - Math.floor(Math.random() * 3)
      ),
      activeUsers: Math.max(1, Math.floor(Math.random() * 10) + 5),
    });
  }
  return trends;
}
