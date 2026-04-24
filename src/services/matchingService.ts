import type { JobOpportunity, OnboardingProfile } from '../types'

export const APPLY_THRESHOLD = 75

const KNOWN_SKILLS = [
  'react',
  'typescript',
  'javascript',
  'python',
  'node',
  'node.js',
  'sql',
  'aws',
  'docker',
  'kubernetes',
  'mongodb',
  'postgresql',
  'java',
  'c++',
  'go',
  'html',
  'css',
  'excel',
  'statistics',
  'machine learning',
  'tensorflow',
  'pytorch',
  'rest api',
  'graphql',
  'agile',
  'git',
]

function normalizeSkill(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[\s/_-]+/g, ' ')
    .replace(/\.+/g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalizeSkill(skill: string): string {
  const normalized = normalizeSkill(skill)

  if (!normalized) return ''

  const map: Record<string, string> = {
    'node.js': 'nodejs',
    'node js': 'nodejs',
    node: 'nodejs',
    'react js': 'react',
    'rest api': 'rest api',
    'restful api': 'rest api',
    'rest apis': 'rest api',
    'java script': 'javascript',
    ts: 'typescript',
    'c plus plus': 'c++',
  }

  return map[normalized] || normalized
}

function tokenizeSkillEntry(value: string): string[] {
  return value
    .split(/[\n,;|/]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsSkillAsTerm(text: string, skill: string): boolean {
  const normalizedText = normalizeSkill(text)
  const canonicalSkill = canonicalizeSkill(skill)

  if (!canonicalSkill) {
    return false
  }

  const escapedSkill = escapeRegex(canonicalSkill)
  const termPattern = new RegExp(`(^|[^a-z0-9+.#])${escapedSkill}($|[^a-z0-9+.#])`, 'i')
  if (termPattern.test(normalizedText)) {
    return true
  }

  // Handle tech mentions like "Node.Js" vs "nodejs" after punctuation removal.
  const compactText = normalizedText.replace(/[\s.]+/g, '')
  const compactSkill = canonicalSkill.replace(/[\s.]+/g, '')
  return compactSkill.length > 3 && compactText.includes(compactSkill)
}

function extractSkillsFromResumeText(text: string): string[] {
  return KNOWN_SKILLS
    .filter((skill) => containsSkillAsTerm(text, skill))
    .map((skill) => canonicalizeSkill(skill))
}

function isSkillLikelyMentioned(text: string, skill: string): boolean {
  return containsSkillAsTerm(text, skill)
}

export interface MatchScore {
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  matchReasons: string[]
  gapReasons: string[]
  recommendation: 'apply_now' | 'improve_first' | 'not_suitable'
}

function buildComparisonInsights(
  profile: OnboardingProfile,
  job: JobOpportunity,
  matchedSkills: string[],
  missingSkills: string[],
): { matchReasons: string[]; gapReasons: string[] } {
  const resumeText = profile.resumeText || ''
  const profileSkillsJoined = profile.skills.join(' ')
  const roleContext = `${job.title} ${job.description}`

  const matchReasons = matchedSkills.slice(0, 3).map((skill) => {
    if (isSkillLikelyMentioned(resumeText, skill)) {
      return `Your resume explicitly mentions '${skill}', which is directly relevant to this role.`
    }

    if (isSkillLikelyMentioned(profileSkillsJoined, skill)) {
      return `You listed '${skill}' in your skills, aligning with the job requirements.`
    }

    return `Your profile shows baseline alignment with '${skill}' for this position.`
  })

  if (matchReasons.length === 0) {
    matchReasons.push(
      `Your resume has partial alignment with ${job.title}; strengthen role-specific keywords to improve visibility.`,
    )
  }

  const gapReasons = missingSkills.slice(0, 3).map((skill) => {
    const appearsInRoleContext = isSkillLikelyMentioned(roleContext, skill)
    if (appearsInRoleContext) {
      return `No direct mention of '${skill}' in your resume/profile, but this role expects it.`
    }

    return `No explicit mention of '${skill}' experience found in your resume.`
  })

  if (gapReasons.length === 0) {
    gapReasons.push('No major skill gaps detected from your resume and profile signals.')
  }

  return { matchReasons, gapReasons }
}

export function calculateMatchScore(
  profile: OnboardingProfile,
  job: JobOpportunity,
): MatchScore {
  const expandedProfileSkills = profile.skills.flatMap((skill) => tokenizeSkillEntry(skill))
  const resumeExtractedSkills = extractSkillsFromResumeText(profile.resumeText)
  const userSkillsLower = new Set(
    [...expandedProfileSkills, ...resumeExtractedSkills]
      .map((s) => canonicalizeSkill(s))
      .filter((s) => s.length > 0),
  )

  const normalizedJobSkills = job.requiredSkills
    .map((skill) => canonicalizeSkill(skill))
    .filter((skill) => skill.length > 0)

  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  normalizedJobSkills.forEach((jobSkill, index) => {
    const isMatched =
      userSkillsLower.has(jobSkill) ||
      isSkillLikelyMentioned(profile.resumeText, jobSkill)

    if (isMatched) {
      if (!matchedSkills.includes(job.requiredSkills[index])) {
        matchedSkills.push(job.requiredSkills[index])
      }
    } else {
      if (!missingSkills.includes(job.requiredSkills[index])) {
        missingSkills.push(job.requiredSkills[index])
      }
    }
  })

  // Score calculation: 70% skill coverage + 20% experience relevance + 10% credentials relevance.
  const skillsScore =
    normalizedJobSkills.length === 0
      ? 70
      : (matchedSkills.length / normalizedJobSkills.length) * 70

  const backgroundText = [
    profile.experience,
    profile.projects,
    profile.education,
    profile.certifications,
    profile.achievements,
  ]
    .join(' ')
    .toLowerCase()

  const experienceScore =
    job.requiredSkills.some((skill) => containsSkillAsTerm(backgroundText, skill)) ||
    containsSkillAsTerm(backgroundText, job.title)
      ? 20
      : 8

  const credentialsScore =
    profile.certifications.trim().length > 0 || profile.education.trim().length > 0 ? 10 : 0

  const resumeCompletenessBonus =
    profile.resumeText.trim().length > 150
      ? Math.min(8, Math.round(profile.resumeText.trim().length / 250))
      : 0

  const score = Math.round(
    Math.min(100, skillsScore + experienceScore + credentialsScore + resumeCompletenessBonus),
  )

  let recommendation: MatchScore['recommendation'] = 'not_suitable'
  if (score >= APPLY_THRESHOLD) {
    recommendation = 'apply_now'
  } else if (score >= 50) {
    recommendation = 'improve_first'
  }

  const { matchReasons, gapReasons } = buildComparisonInsights(
    profile,
    job,
    matchedSkills,
    missingSkills,
  )

  return {
    score: Math.min(100, score),
    matchedSkills,
    missingSkills,
    matchReasons,
    gapReasons,
    recommendation,
  }
}

export function generateInterviewQuestions(job: JobOpportunity): string[] {
  const baseQuestions = [
    'Tell me about yourself and why you are interested in this role.',
    `What experience do you have with ${job.requiredSkills[0] || 'the required technologies'}?`,
    'Describe a challenging project you have worked on.',
    'How do you handle feedback and criticism?',
    'Where do you see yourself in 5 years?',
    'Why do you want to work for us?',
    'What are your greatest strengths?',
    'What areas would you like to improve?',
  ]

  return baseQuestions.slice(0, 5)
}
