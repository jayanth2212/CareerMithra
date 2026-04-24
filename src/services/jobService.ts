import type { JobOpportunity } from '../types'
import { fetchJobsFromApi } from './apiClient'

const FALLBACK_JOBS: JobOpportunity[] = [
  {
    id: 'op-1',
    title: 'Frontend Developer',
    company: 'Infosys',
    location: 'Bengaluru, Karnataka, India',
    type: 'Job',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS'],
    description:
      'Build and maintain modern web interfaces for enterprise products using React and TypeScript.',
    deadline: '2026-06-15',
    source: 'CareerMithra fallback',
    postedAt: '2026-04-15',
    publisher: 'CareerMithra',
    salary: '6-10 LPA',
  },
  {
    id: 'op-2',
    title: 'Data Analyst Intern',
    company: 'TCS',
    location: 'Hyderabad, Telangana, India',
    type: 'Job',
    requiredSkills: ['Python', 'SQL', 'Excel', 'Statistics'],
    description:
      'Support business analytics teams with dashboarding, reporting, and actionable insights.',
    deadline: '2026-06-10',
    source: 'CareerMithra fallback',
    postedAt: '2026-04-12',
    publisher: 'CareerMithra',
    salary: '3-5 LPA',
  },
]

export async function fetchRealJobs(): Promise<JobOpportunity[]> {
  try {
    return await fetchJobsFromApi()
  } catch (error) {
    console.warn('Failed to fetch live jobs, using fallback data:', error)
    return FALLBACK_JOBS
  }
}

export async function searchJobs(query: string): Promise<JobOpportunity[]> {
  const allJobs = await fetchRealJobs()
  const lowerQuery = query.toLowerCase()
  return allJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      job.requiredSkills.some((skill) =>
        skill.toLowerCase().includes(lowerQuery),
      ),
  )
}
