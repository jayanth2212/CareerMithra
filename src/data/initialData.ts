import type {
  CareerMithraState,
  CareerPath,
  JobOpportunity,
  LearningTask,
  OnboardingProfile,
  RoadmapStep,
} from '../types'
import { predefinedJobs } from './predefinedJobs'

export const emptyProfile: OnboardingProfile = {
  education: '',
  skills: [],
  projects: '',
  achievements: '',
  experience: '',
  certifications: '',
  assessmentEnabled: false,
  aptitudeScore: undefined,
  personalityType: '',
  resumeText: '',
}

export const baseCareerPaths: CareerPath[] = [
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    description:
      'Design and develop interactive web applications with strong UX practices and maintainable code.',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Testing'],
    growthOpportunities: ['Senior Frontend Engineer', 'UI Architect', 'Engineering Manager'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description:
      'Interpret data trends and translate them into decision-ready insights for business and product teams.',
    requiredSkills: ['SQL', 'Python', 'Statistics', 'Visualization', 'Communication'],
    growthOpportunities: ['Senior Data Analyst', 'Analytics Lead', 'Product Analyst'],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description:
      'Lead product strategy by balancing customer needs, technical feasibility, and business outcomes.',
    requiredSkills: ['Roadmapping', 'Communication', 'Problem Solving', 'Research', 'Prioritization'],
    growthOpportunities: ['Senior Product Manager', 'Group Product Manager', 'Head of Product'],
  },
]

export const baseRoadmap: RoadmapStep[] = [
  {
    id: 'rf-1',
    stage: 'Learning fundamentals',
    title: 'Complete domain foundations and role-specific basics',
    timeline: 'Weeks 1-4',
    status: 'not started',
  },
  {
    id: 'sb-1',
    stage: 'Skill building',
    title: 'Practice core tools through weekly exercises',
    timeline: 'Weeks 5-8',
    status: 'not started',
  },
  {
    id: 'ct-1',
    stage: 'Certifications',
    title: 'Attempt one industry-recognized certification',
    timeline: 'Weeks 9-10',
    status: 'not started',
  },
  {
    id: 'pj-1',
    stage: 'Projects',
    title: 'Build and publish portfolio-ready capstone project',
    timeline: 'Weeks 11-14',
    status: 'not started',
  },
]

export const baseLearningTasks: LearningTask[] = [
  {
    id: 'lt-1',
    type: 'Learning Material',
    title: 'Structured learning path for role fundamentals',
    description: 'Follow a guided course and summarize each module in your own words.',
    relatedSkill: 'Foundations',
  },
  {
    id: 'lt-2',
    type: 'Practice Exercise',
    title: 'Daily problem solving challenge',
    description: 'Solve one timed challenge every day and track time-to-solution.',
    relatedSkill: 'Problem Solving',
  },
  {
    id: 'lt-3',
    type: 'Project Idea',
    title: 'Career-focused portfolio mini project',
    description: 'Build a project that demonstrates at least three role-relevant competencies.',
    relatedSkill: 'Project Execution',
  },
]

export const baseOpportunities: JobOpportunity[] = predefinedJobs

export const initialState: CareerMithraState = {
  user: null,
  authToken: null,
  isAuthenticated: false,
  onboardingComplete: false,
  profile: emptyProfile,
  recommendedCareers: baseCareerPaths,
  selectedCareerId: null,
  roadmap: baseRoadmap,
  learningTasks: baseLearningTasks,
  completedMilestones: 0,
  ongoingTasks: 0,
  readinessScore: 0,
  opportunities: baseOpportunities,
  applications: [],
  jobsLoading: false,
  notifications: [
    'Welcome to CareerMithra. Complete onboarding to unlock all dashboards.',
  ],
}
