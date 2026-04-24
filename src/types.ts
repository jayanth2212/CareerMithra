export type TaskStatus = 'not started' | 'in progress' | 'completed'

export type ApplicationStatus =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Rejected'
  | 'Selected'

export interface UserAccount {
  fullName: string
  email: string
  password: string
}

export interface OnboardingProfile {
  education: string
  skills: string[]
  projects: string
  achievements: string
  experience: string
  certifications: string
  assessmentEnabled: boolean
  aptitudeScore?: number
  personalityType?: string
  resumeText: string
}

export interface CareerPath {
  id: string
  title: string
  description: string
  requiredSkills: string[]
  growthOpportunities: string[]
}

export interface RoadmapStep {
  id: string
  stage: 'Learning fundamentals' | 'Skill building' | 'Certifications' | 'Projects'
  title: string
  timeline: string
  status: TaskStatus
}

export interface LearningTask {
  id: string
  type: 'Learning Material' | 'Practice Exercise' | 'Project Idea'
  title: string
  description: string
  relatedSkill: string
}

export interface JobOpportunity {
  id: string
  title: string
  company: string
  location: string
  type: 'Job' | 'Internship' | 'Opportunity'
  requiredSkills: string[]
  description: string
  deadline: string
  applyUrl?: string
  source?: string
  postedAt?: string
  publisher?: string
  salary?: string
}

export interface ApplicationRecord {
  id: string
  opportunityId: string
  title: string
  company: string
  appliedDate: string
  deadline: string
  status: ApplicationStatus
  followUpReminder: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

export interface CareerMithraState {
  user: UserAccount | null
  authToken: string | null
  isAuthenticated: boolean
  onboardingComplete: boolean
  profile: OnboardingProfile
  recommendedCareers: CareerPath[]
  selectedCareerId: string | null
  roadmap: RoadmapStep[]
  learningTasks: LearningTask[]
  completedMilestones: number
  ongoingTasks: number
  readinessScore: number
  opportunities: JobOpportunity[]
  applications: ApplicationRecord[]
  notifications: string[]
  jobsLoading: boolean
}
