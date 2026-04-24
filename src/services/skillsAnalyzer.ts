import type { OnboardingProfile, JobOpportunity } from "../types";

/**
 * Advanced skills analysis and categorization
 */

export interface SkillCategories {
  technical: string[];
  frameworks: string[];
  tools: string[];
  soft: string[];
  certifications: string[];
}

export interface SkillGap {
  skill: string;
  category: keyof SkillCategories;
  priority: "critical" | "high" | "medium" | "low";
  relevantJobs: number;
}

// Categorized skill library
const TECHNICAL_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust",
  "html", "css", "sql", "r", "scala", "kotlin", "php", "ruby", "swift",
  "linux", "bash", "powerscript"
];

const FRAMEWORKS = [
  "react", "vue", "angular", "svelte", "next.js", "express", "django",
  "flask", "spring boot", "fastapi", "rails", "laravel", "node.js",
  "vue.js", "nuxt", "gatsby", "remix", "remix.run"
];

const TOOLS = [
  "git", "docker", "kubernetes", "jenkins", "gitlab", "github", "aws",
  "gcp", "azure", "terraform", "ansible", "jira", "figma", "postman",
  "tableau", "powerbi", "excel", "slack", "confluence"
];

const SOFT_SKILLS = [
  "communication", "teamwork", "leadership", "problem solving",
  "critical thinking", "project management", "time management",
  "negotiation", "public speaking", "mentoring", "collaboration",
  "adaptability", "creativity", "attention to detail"
];

const CERTIFICATIONS = [
  "aws certified", "azure certified", "google cloud certified",
  "cissp", "ccna", "pmp", "scrum master", "cka", "ckad"
];

function normalizeSkill(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[\s/_-]+/g, " ")
    .replace(/\.+/g, ".")
    .trim();
}

function categorizeSkill(skill: string): keyof SkillCategories {
  const normalized = normalizeSkill(skill);

  if (TECHNICAL_SKILLS.some(t => normalized.includes(t) || t.includes(normalized))) {
    return "technical";
  }
  if (FRAMEWORKS.some(f => normalized.includes(f) || f.includes(normalized))) {
    return "frameworks";
  }
  if (TOOLS.some(t => normalized.includes(t) || t.includes(normalized))) {
    return "tools";
  }
  if (CERTIFICATIONS.some(c => normalized.includes(c) || c.includes(normalized))) {
    return "certifications";
  }
  // Default to soft skills if not categorized
  return "soft";
}

/**
 * Categorize profile skills
 */
export function categorizeProfileSkills(skills: string[]): SkillCategories {
  const categories: SkillCategories = {
    technical: [],
    frameworks: [],
    tools: [],
    soft: [],
    certifications: []
  };

  skills.forEach(skill => {
    const category = categorizeSkill(skill);
    categories[category].push(skill);
  });

  return categories;
}

/**
 * Extract skills from text with better parsing
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];

  const normalized = text.toLowerCase();
  const found = new Set<string>();

  // Check all known skills
  const allSkills = [
    ...TECHNICAL_SKILLS,
    ...FRAMEWORKS,
    ...TOOLS,
    ...SOFT_SKILLS,
    ...CERTIFICATIONS
  ];

  allSkills.forEach(skill => {
    // Use word boundary matching
    const pattern = new RegExp(`\\b${skill.replace(/\./g, "\\.")}\\b`, "gi");
    if (pattern.test(normalized)) {
      found.add(skill);
    }
  });

  return Array.from(found);
}

/**
 * Identify skill gaps compared to job opportunities
 */
export function identifySkillGaps(
  profileSkills: string[],
  jobOpportunities: JobOpportunity[]
): SkillGap[] {
  const profileSet = new Set(profileSkills.map(s => normalizeSkill(s)));
  const jobSkillFrequency = new Map<string, number>();

  // Count how many jobs require each skill
  jobOpportunities.forEach(job => {
    job.requiredSkills.forEach(skill => {
      const normalized = normalizeSkill(skill);
      jobSkillFrequency.set(normalized, (jobSkillFrequency.get(normalized) || 0) + 1);
    });
  });

  // Find missing skills
  const gaps: SkillGap[] = [];
  jobSkillFrequency.forEach((count, skill) => {
    if (!profileSet.has(skill)) {
      // Determine priority by frequency
      let priority: "critical" | "high" | "medium" | "low";
      const threshold = jobOpportunities.length;
      
      if (count >= threshold * 0.7) priority = "critical";
      else if (count >= threshold * 0.4) priority = "high";
      else if (count >= threshold * 0.2) priority = "medium";
      else priority = "low";

      gaps.push({
        skill,
        category: categorizeSkill(skill),
        priority,
        relevantJobs: count
      });
    }
  });

  // Sort by priority and frequency
  return gaps.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.relevantJobs - a.relevantJobs;
  });
}

/**
 * Calculate skill match percentage between profile and job
 */
export function calculateSkillMatchPercentage(
  profileSkills: string[],
  jobSkills: string[]
): number {
  if (jobSkills.length === 0) return 100;

  const profileSet = new Set(profileSkills.map(s => normalizeSkill(s)));
  const matches = jobSkills.filter(skill => {
    return profileSet.has(normalizeSkill(skill));
  }).length;

  return Math.round((matches / jobSkills.length) * 100);
}

/**
 * Get skill recommendations for career path growth
 */
export function getCareerSkillRecommendations(
  profileSkills: string[],
  careerRequiredSkills: string[],
  jobMarketSkills: string[]
): { immediate: string[]; growth: string[] } {
  const profileSet = new Set(profileSkills.map(s => normalizeSkill(s)));
  const immediateNeeds: string[] = [];
  const growthSkills: string[] = [];

  // Immediate needs: required by career and in job market
  careerRequiredSkills.forEach(skill => {
    const normalized = normalizeSkill(skill);
    if (!profileSet.has(normalized)) {
      immediateNeeds.push(skill);
    }
  });

  // Growth skills: in job market but not required for current career
  jobMarketSkills.forEach(skill => {
    const normalized = normalizeSkill(skill);
    if (!profileSet.has(normalized) && !immediateNeeds.includes(skill)) {
      growthSkills.push(skill);
    }
  });

  return {
    immediate: immediateNeeds.slice(0, 5),
    growth: growthSkills.slice(0, 5)
  };
}

/**
 * Assess profile completeness with weighted scoring
 */
export function assessProfileCompleteness(profile: OnboardingProfile): {
  percentage: number;
  feedback: string[];
  priority: string[];
} {
  const feedback: string[] = [];
  const priority: string[] = [];

  const weights = {
    resumeText: 0.25,
    skills: 0.20,
    experience: 0.20,
    education: 0.15,
    projects: 0.10,
    certifications: 0.05,
    achievements: 0.05
  };

  let score = 0;

  if (!profile.resumeText?.trim()) {
    feedback.push("Add your resume text to improve job matching");
    priority.push("resumeText");
  } else {
    score += weights.resumeText;
    feedback.push("✓ Resume provided");
  }

  if (!profile.skills?.length) {
    feedback.push("Add your technical and soft skills");
    priority.push("skills");
  } else {
    score += weights.skills;
    feedback.push(`✓ ${profile.skills.length} skills listed`);
  }

  if (!profile.experience?.trim()) {
    feedback.push("Share your work experience (internships, projects, freelance)");
    priority.push("experience");
  } else {
    score += weights.experience;
    feedback.push("✓ Work experience added");
  }

  if (!profile.education?.trim()) {
    feedback.push("Add your education background");
    priority.push("education");
  } else {
    score += weights.education;
    feedback.push("✓ Education information provided");
  }

  if (!profile.projects?.trim()) {
    feedback.push("Showcase your projects to stand out");
    priority.push("projects");
  } else {
    score += weights.projects;
    feedback.push("✓ Projects listed");
  }

  if (!profile.certifications?.trim()) {
    feedback.push("Add any relevant certifications or courses");
  } else {
    score += weights.certifications;
    feedback.push("✓ Certifications added");
  }

  if (!profile.achievements?.trim()) {
    feedback.push("Highlight achievements and awards");
  } else {
    score += weights.achievements;
    feedback.push("✓ Achievements documented");
  }

  const percentage = Math.round(score * 100);

  return {
    percentage,
    feedback,
    priority
  };
}
