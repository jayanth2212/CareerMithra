import type { JobOpportunity, CareerPath, OnboardingProfile } from "../types";
import { calculateSkillMatchPercentage } from "./skillsAnalyzer";

/**
 * Career recommendation engine based on profile data and job market
 */

export interface CareerRecommendation extends CareerPath {
  fitScore: number; // 0-100
  matchedSkillsCount: number;
  missingSkillsCount: number;
  jobMarketDemand: number; // jobs available in market
  avgSalaryRange?: string;
  growthTrend: "high" | "medium" | "low";
  timeToReady: string; // estimated time to be job-ready
}

/**
 * Analyze career fit based on profile and available jobs
 */
export function analyzeCareerFit(
  career: CareerPath,
  profile: OnboardingProfile,
  relevantJobs: JobOpportunity[]
): CareerRecommendation {
  const profileSkills = profile.skills || [];
  
  // Calculate skill match
  const matchPercentage = calculateSkillMatchPercentage(
    profileSkills,
    career.requiredSkills
  );

  const matchedSkills = career.requiredSkills.filter(skill =>
    profileSkills.some(pskill => pskill.toLowerCase() === skill.toLowerCase())
  ).length;

  const missingSkills = career.requiredSkills.length - matchedSkills;

  // Assess job market demand
  const careRelatedJobs = relevantJobs.filter(job =>
    job.title.toLowerCase().includes(career.title.toLowerCase())
  );

  const demand = careRelatedJobs.length;

  // Calculate fit score (weighted)
  const fitScore = Math.round(
    (matchPercentage * 0.6) + // 60% weight on skill match
    (Math.min(demand, 50) * 2) + // 40% weight on job market (0-100)
    (profileSkills.length * 5) // bonus for profile completeness
  ) / Math.max(1, (profileSkills.length / 10 + 1));

  // Estimate time to ready based on missing skills
  let timeToReady = "Ready now";
  if (missingSkills > 5) timeToReady = "3-6 months";
  else if (missingSkills > 2) timeToReady = "1-3 months";
  else if (missingSkills > 0) timeToReady = "2-4 weeks";

  // Determine growth trend
  let growthTrend: "high" | "medium" | "low" = "medium";
  if (demand > 20) growthTrend = "high";
  else if (demand < 5) growthTrend = "low";

  return {
    ...career,
    fitScore: Math.max(0, Math.min(100, fitScore)),
    matchedSkillsCount: matchedSkills,
    missingSkillsCount: missingSkills,
    jobMarketDemand: demand,
    growthTrend,
    timeToReady
  };
}

/**
 * Generate ranked career recommendations
 */
export function generateCareerRecommendations(
  baseCareers: CareerPath[],
  profile: OnboardingProfile,
  availableJobs: JobOpportunity[]
): CareerRecommendation[] {
  const recommendations = baseCareers
    .map(career => analyzeCareerFit(career, profile, availableJobs))
    .sort((a, b) => {
      // Primary sort: fit score
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }
      // Secondary sort: job market demand
      return b.jobMarketDemand - a.jobMarketDemand;
    });

  return recommendations;
}

/**
 * Get actionable next steps for a selected career
 */
export function getCareerActionPlan(
  career: CareerRecommendation,
  profile: OnboardingProfile
): string[] {
  const steps: string[] = [];

  if (career.missingSkillsCount === 0) {
    steps.push("🎯 You have all core skills! Focus on advanced topics and networking");
    steps.push("📁 Build a portfolio project showcasing your expertise");
    steps.push("🤝 Connect with professionals in " + career.title);
  } else if (career.missingSkillsCount <= 2) {
    steps.push(`⚡ Close ${career.missingSkillsCount} skill gap(s) to be highly competitive`);
    steps.push("📚 Start with course on the missing skills");
    steps.push("🛠️ Build portfolio projects using new skills");
    steps.push("🔍 Target junior/entry-level positions");
  } else {
    steps.push(`📈 Build ${career.missingSkillsCount} new skills for this role`);
    steps.push("📅 Create a 3-month skill-building plan");
    steps.push("🏗️ Start with fundamentals and create small projects");
    steps.push("💡 Look for internships or entry-level roles to get practice");
  }

  if (!profile.resumeText || profile.resumeText.length < 100) {
    steps.push("📝 Update resume with concrete achievements and metrics");
  }

  if (!profile.projects || profile.projects.length < 50) {
    steps.push("🚀 Document your projects with links and descriptions");
  }

  return steps;
}

/**
 * Suggest related roles based on career path
 */
export function getSuggestedRoles(
  career: CareerRecommendation,
  allJobs: JobOpportunity[]
): JobOpportunity[] {
  return allJobs
    .filter(job => {
      const jobTitle = job.title.toLowerCase();
      const careerTitle = career.title.toLowerCase();
      
      // Match by exact title, keywords, or skill overlap
      return jobTitle.includes(careerTitle) ||
        career.requiredSkills.some(skill =>
          job.requiredSkills.some(jskill =>
            skill.toLowerCase() === jskill.toLowerCase()
          )
        );
    })
    .slice(0, 5);
}

/**
 * Calculate market pay estimate based on jobs
 */
export function estimateMarketPay(jobs: JobOpportunity[]): string {
  const jobsWithSalary = jobs.filter(j => j.salary);
  
  if (jobsWithSalary.length === 0) {
    return "Market dependent";
  }

  // Simple average extraction (assumes salary format like "$50K - $70K")
  const salaries = jobsWithSalary
    .map(j => {
      const match = j.salary?.match(/\$?\s*(\d+)k?/i);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(s => s > 0);

  if (salaries.length === 0) return "Market dependent";

  const avg = Math.round(salaries.reduce((a, b) => a + b) / salaries.length);
  return `$${avg}K annually (market avg)`;
}
