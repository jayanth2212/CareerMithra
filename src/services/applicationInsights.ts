import type { ApplicationRecord } from "../types";

/**
 * Application tracking and insights
 */

export interface ApplicationInsight {
  successRate: number; // percentage of applied jobs that result in interview or selection
  averageTimeToResponse: number; // average days from apply to first response
  strongMatchRate: number; // percentage of applications that were strong matches (75%+)
  keyBottleneck: string; // "low_match_score" | "high_rejections" | "slow_responses" | "low_applications"
  recommendations: string[];
}

export interface ApplicationTrend {
  date: string;
  applied: number;
  shortlisted: number;
  interview: number;
  selected: number;
  rejected: number;
}

export interface NextStepRecommendation {
  appId: string;
  action: string;
  urgency: "high" | "medium" | "low";
  description: string;
  resources?: string[];
}

/**
 * Calculate success rate and key insights
 */
export function analyzeApplications(
  applications: ApplicationRecord[]
): ApplicationInsight {
  if (applications.length === 0) {
    return {
      successRate: 0,
      averageTimeToResponse: 0,
      strongMatchRate: 0,
      keyBottleneck: "low_applications",
      recommendations: [
        "🚀 Start applying to jobs! More applications = more opportunities",
        "📋 Use Job Discovery to find well-matched positions",
        "⚡ Aim for at least 5-10 quality applications per week"
      ]
    };
  }

  // Calculate success rate
  const successfulApps = applications.filter(
    app => app.status === "Selected" || app.status === "Shortlisted" || app.status === "Interview"
  ).length;
  const successRate = Math.round((successfulApps / applications.length) * 100);

  // Calculate average time to response
  const appsWithResponse = applications.filter(
    app => app.status !== "Applied"
  );
  const averageTimeToResponse = appsWithResponse.length > 0
    ? Math.round(
        appsWithResponse.reduce((sum, app) => {
          const applied = new Date(app.appliedDate).getTime();
          const now = new Date().getTime();
          const days = Math.floor((now - applied) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / appsWithResponse.length
      )
    : 0;

  // Calculate strong match rate
  const strongMatches = applications.filter(app => app.matchScore >= 75).length;
  const strongMatchRate = Math.round((strongMatches / applications.length) * 100);

  // Identify bottleneck
  let keyBottleneck: "low_match_score" | "high_rejections" | "slow_responses" | "low_applications";
  const rejectionRate = applications.filter(a => a.status === "Rejected").length / applications.length;
  const appliedRate = applications.filter(a => a.status === "Applied").length / applications.length;

  if (strongMatchRate < 50) {
    keyBottleneck = "low_match_score";
  } else if (rejectionRate > 0.3) {
    keyBottleneck = "high_rejections";
  } else if (appliedRate > 0.7) {
    keyBottleneck = "slow_responses";
  } else {
    keyBottleneck = "low_applications";
  }

  // Generate recommendations
  const recommendations = getRecommendationsByBottleneck(
    keyBottleneck,
    successRate,
    strongMatchRate,
    applications
  );

  return {
    successRate,
    averageTimeToResponse,
    strongMatchRate,
    keyBottleneck,
    recommendations
  };
}

/**
 * Get recommendations based on identified bottleneck
 */
function getRecommendationsByBottleneck(
  bottleneck: string,
  _successRate: number,
  strongMatchRate: number,
  applications: ApplicationRecord[]
): string[] {
  const recommendations: string[] = [];

  switch (bottleneck) {
    case "low_match_score":
      recommendations.push("📚 Update your resume and profile with more relevant skills and experiences");
      recommendations.push("🎯 Focus on improving your 3-5 most in-demand skills");
      recommendations.push("💼 Apply only to positions where you have 75%+ skill match");
      if (strongMatchRate < 30) {
        recommendations.push("⚠️ Your profile may be too general. Tailor it to a specific role");
      }
      break;

    case "high_rejections":
      recommendations.push("🎓 Revise your resume to highlight achievements and metrics");
      recommendations.push("💡 Prepare better cover letters explaining your fit for each role");
      recommendations.push("🤝 Improve your interview skills (practice common questions)");
      if (applications.filter(a => a.status === "Rejected").length > 5) {
        recommendations.push("🔄 Keep applying! High volume helps overcome rejection rate");
      }
      break;

    case "slow_responses":
      recommendations.push("📞 Follow up on pending applications after 1 week");
      recommendations.push("🌐 Check email/LinkedIn daily for recruiter messages");
      recommendations.push("🚀 Apply to more positions to increase response rate");
      recommendations.push("⚡ Set reminders for application deadlines");
      break;

    case "low_applications":
      recommendations.push("🎯 Target at least 5-10 applications per week for consistent pipeline");
      recommendations.push("📊 Use Job Discovery filters to identify matching opportunities");
      recommendations.push("✅ Use application checklist: High match score + relevant skills");
      break;
  }

  return recommendations;
}

/**
 * Suggest next actions for specific applications
 */
export function getApplicationNextSteps(
  application: ApplicationRecord
): NextStepRecommendation[] {
  const steps: NextStepRecommendation[] = [];
  const now = new Date();
  const appliedDate = new Date(application.appliedDate);
  const deadline = new Date(application.deadline);
  const daysAgo = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  switch (application.status) {
    case "Applied":
      if (daysAgo >= 7) {
        steps.push({
          appId: application.id,
          action: "Send follow-up",
          urgency: "high",
          description: "It's been a week. Send a polite follow-up message to the recruiter.",
          resources: ["Follow-up email template", "LinkedIn message tips"]
        });
      }

      if (daysUntilDeadline <= 3) {
        steps.push({
          appId: application.id,
          action: "Deadline approaching",
          urgency: "high",
          description: `Only ${daysUntilDeadline} days left to apply or submit additional materials.`,
        });
      }

      steps.push({
        appId: application.id,
        action: "Prepare profile",
        urgency: "medium",
        description: "Make sure your LinkedIn is updated and matches your resume.",
      });

      if (application.matchScore < 75) {
        steps.push({
          appId: application.id,
          action: "Upskill on missing requirements",
          urgency: "low",
          description: `Missing ${application.missingSkills.length} key skills. Consider learning them.`,
          resources: application.missingSkills.map(s => `Learn: ${s}`)
        });
      }
      break;

    case "Shortlisted":
      steps.push({
        appId: application.id,
        action: "Prepare for interview",
        urgency: "high",
        description: "Congratulations! Interview likely coming. Review the role and practice answers.",
        resources: ["Research company", "Prepare 3 projects", "Practice behavioral questions"]
      });

      steps.push({
        appId: application.id,
        action: "Ensure contact info is updated",
        urgency: "high",
        description: "Make sure your phone and email are correct so recruiters can reach you.",
      });

      steps.push({
        appId: application.id,
        action: "Review job requirements",
        urgency: "medium",
        description: "Review the job description and be ready to discuss how you match each requirement.",
      });
      break;

    case "Interview":
      steps.push({
        appId: application.id,
        action: "Ace the interview",
        urgency: "high",
        description: "You're in the final stages! Prepare technical solutions and practice explanations.",
        resources: ["System design patterns", "Technical problem solving", "Behavioral questions"]
      });

      steps.push({
        appId: application.id,
        action: "Prepare questions to ask",
        urgency: "medium",
        description: "Research and prepare 5-10 thoughtful questions about the role and company.",
        resources: ["Interview question examples", "Company research guide"]
      });

      steps.push({
        appId: application.id,
        action: "Plan logistics",
        urgency: "high",
        description: "Know the interview time, location/platform, and who you're meeting. Plan to arrive early.",
      });
      break;

    case "Rejected":
      steps.push({
        appId: application.id,
        action: "Request feedback",
        urgency: "medium",
        description: "Politely ask the recruiter for feedback on your application.",
        resources: ["Feedback request template"]
      });

      steps.push({
        appId: application.id,
        action: "Identify learning opportunities",
        urgency: "low",
        description: "Analyze what skills or experience might have been missing.",
      });

      steps.push({
        appId: application.id,
        action: "Keep applying",
        urgency: "high",
        description: "Don't get discouraged. Apply to more relevant positions.",
      });
      break;

    case "Selected":
      steps.push({
        appId: application.id,
        action: "Prepare for offer negotiation",
        urgency: "high",
        description: "Research salary ranges, benefits, and prepare negotiation talking points.",
        resources: ["Salary negotiation guide", "Benefits checklist"]
      });

      steps.push({
        appId: application.id,
        action: "Plan next steps",
        urgency: "medium",
        description: "Verify offer details, timeline for onboarding, and any paperwork needed.",
      });

      steps.push({
        appId: application.id,
        action: "Celebrate! 🎉",
        urgency: "low",
        description: "You did it! Reflect on what worked and update your approach for future applications.",
      });
      break;
  }

  return steps;
}

/**
 * Calculate application trends over time
 */
export function calculateApplicationTrends(
  applications: ApplicationRecord[]
): ApplicationTrend[] {
  // Group applications by week
  const trends = new Map<string, ApplicationTrend>();

  applications.forEach(app => {
    const date = new Date(app.appliedDate);
    const week = getWeekStart(date).toISOString().split("T")[0];

    if (!trends.has(week)) {
      trends.set(week, {
        date: week,
        applied: 0,
        shortlisted: 0,
        interview: 0,
        selected: 0,
        rejected: 0
      });
    }

    const trend = trends.get(week)!;
    trend.applied += 1;

    if (app.status === "Shortlisted") trend.shortlisted += 1;
    if (app.status === "Interview") trend.interview += 1;
    if (app.status === "Selected") trend.selected += 1;
    if (app.status === "Rejected") trend.rejected += 1;
  });

  return Array.from(trends.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get week start date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Estimate interview success rate
 */
export function estimateInterviewSuccess(applications: ApplicationRecord[]): {
  rate: number;
  interviews: number;
  selectionRate: number;
} {
  const interviews = applications.filter(a => a.status === "Interview").length;
  const selected = applications.filter(a => a.status === "Selected").length;

  const interviewRate = applications.length > 0
    ? Math.round((interviews / applications.length) * 100)
    : 0;

  const selectionRate = interviews > 0
    ? Math.round((selected / interviews) * 100)
    : 0;

  return {
    rate: interviewRate,
    interviews,
    selectionRate
  };
}
