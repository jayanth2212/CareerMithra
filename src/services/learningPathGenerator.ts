import type { LearningTask, CareerPath, OnboardingProfile } from "../types";
import type { SkillGap } from "./skillsAnalyzer";

/**
 * Intelligent learning path generator based on skill gaps and career goals
 */

export interface LearningPath {
  skillGap: SkillGap;
  tasks: LearningTask[];
  estimatedDays: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface CareerLearningPlan {
  career: CareerPath;
  totalWeeks: number;
  phases: LearningPhase[];
  resources: string[];
}

export interface LearningPhase {
  name: string;
  duration: string;
  skills: string[];
  tasks: LearningTask[];
}

// Curated learning resources by skill
const LEARNING_RESOURCES: Record<string, string[]> = {
  "react": [
    "React Official Documentation",
    "freeCodeCamp React Course",
    "Build 10 React Projects",
    "React Testing Library"
  ],
  "typescript": [
    "TypeScript Official Handbook",
    "TypeScript Deep Dive",
    "Build projects with TS",
    "Advanced TypeScript Patterns"
  ],
  "javascript": [
    "JavaScript.info",
    "You Don't Know JS",
    "Eloquent JavaScript",
    "JavaScript 30 Challenge"
  ],
  "python": [
    "Python.org Tutorial",
    "Automate the Boring Stuff",
    "Real Python",
    "Python 100 Days Challenge"
  ],
  "sql": [
    "SQLZoo Interactive",
    "Mode Analytics SQL Tutorial",
    "LeetCode SQL Problems",
    "Database Design Fundamentals"
  ],
  "aws": [
    "AWS Free Tier",
    "AWS essentials on Coursera",
    "CloudAcademy",
    "Build 5 AWS Projects"
  ],
  "docker": [
    "Docker Official Documentation",
    "Docker for Beginners",
    "Containerize Applications",
    "Docker Compose Projects"
  ]
};

const SKILL_DIFFICULTY: Record<string, "beginner" | "intermediate" | "advanced"> = {
  "html": "beginner",
  "css": "beginner",
  "javascript": "beginner",
  "communication": "beginner",
  "excel": "beginner",
  "git": "beginner",
  "sql": "intermediate",
  "react": "intermediate",
  "typescript": "intermediate",
  "python": "intermediate",
  "rest api": "intermediate",
  "node": "intermediate",
  "docker": "intermediate",
  "kubernetes": "advanced",
  "graphql": "advanced",
  "aws": "advanced",
  "machine learning": "advanced"
};

const TASK_TEMPLATES = {
  beginner: [
    { type: "Learning Material" as const, duration: 5, prefix: "Learn fundamentals of" },
    { type: "Practice Exercise" as const, duration: 3, prefix: "Code 5 simple programs in" },
    { type: "Project Idea" as const, duration: 5, prefix: "Build a beginner project using" }
  ],
  intermediate: [
    { type: "Learning Material" as const, duration: 7, prefix: "Master advanced concepts in" },
    { type: "Practice Exercise" as const, duration: 7, prefix: "Solve algorithmic problems with" },
    { type: "Project Idea" as const, duration: 10, prefix: "Build a real-world application with" }
  ],
  advanced: [
    { type: "Learning Material" as const, duration: 10, prefix: "Deep dive into architecture of" },
    { type: "Practice Exercise" as const, duration: 14, prefix: "Optimize and refactor projects using" },
    { type: "Project Idea" as const, duration: 14, prefix: "Build a production-ready system with" }
  ]
};

/**
 * Generate learning tasks for a skill gap
 */
export function generateLearningPath(
  skillGap: SkillGap
): LearningPath {
  const difficulty = (SKILL_DIFFICULTY[skillGap.skill] || "intermediate") as "beginner" | "intermediate" | "advanced";
  const templates = TASK_TEMPLATES[difficulty];
  
  const tasks: LearningTask[] = templates.map((template, index) => {
    return {
      id: `learning-${skillGap.skill}-${index}`,
      type: template.type,
      title: `${template.prefix} ${skillGap.skill}`,
      description: getTaskDescription(skillGap.skill, template.type, difficulty),
      relatedSkill: skillGap.skill
    };
  });

  const totalDays = templates.reduce((sum, t) => sum + t.duration, 0);

  return {
    skillGap,
    tasks,
    estimatedDays: totalDays,
    difficulty
  };
}

/**
 * Generate detailed task description
 */
function getTaskDescription(
  skill: string,
  taskType: LearningTask["type"],
  difficulty: "beginner" | "intermediate" | "advanced"
): string {
  const descriptions: Record<string, Record<string, string>> = {
    "Learning Material": {
      beginner: `Complete foundational course or tutorial on ${skill}. Follow along with examples and take notes on key concepts.`,
      intermediate: `Study advanced patterns and best practices for ${skill}. Focus on design patterns and optimization techniques.`,
      advanced: `Research cutting-edge trends and architectural approaches for ${skill}. Read white papers and technical blogs.`
    },
    "Practice Exercise": {
      beginner: `Solve simple coding challenges focused on ${skill}. Start with 5-10 problems on coding platforms.`,
      intermediate: `Solve medium-level algorithmic problems using ${skill}. Aim for 10-15 problems, focusing on time complexity.`,
      advanced: `Optimize existing codebases and solve complex problems with ${skill}. Contribute to open source projects.`
    },
    "Project Idea": {
      beginner: `Build a simple project (todo app, calculator, etc.) using ${skill}. Document your code and push to GitHub.`,
      intermediate: `Build a fully functional application using ${skill} with proper testing and documentation.`,
      advanced: `Build a production-ready system using ${skill}. Include proper error handling, logging, and performance optimization.`
    }
  };

  return descriptions[taskType]?.[difficulty] || `Complete a project to master ${skill}`;
}

/**
 * Get learning resources for a skill
 */
export function getLearningResources(skill: string): string[] {
  return LEARNING_RESOURCES[skill.toLowerCase()] || [
    `Search "${skill}" on Coursera`,
    `Find tutorials on Udemy`,
    `Read documentation on official website`,
    `Practice on LeetCode or HackerRank`
  ];
}

/**
 * Generate comprehensive career learning plan
 */
export function generateCareerLearningPlan(
  career: CareerPath,
  _profile: OnboardingProfile,
  skillGaps: SkillGap[]
): CareerLearningPlan {
  // Prioritize immediate skill gaps
  const criticalGaps = skillGaps.filter(g => g.priority === "critical").slice(0, 4);
  const highGaps = skillGaps.filter(g => g.priority === "high").slice(0, 3);

  // Phase 1: Critical skills (4 weeks)
  const phase1: LearningPhase = {
    name: "Foundation: Core Skills",
    duration: "Weeks 1-4",
    skills: criticalGaps.map(g => g.skill),
    tasks: criticalGaps.flatMap(gap => {
      const path = generateLearningPath(gap);
      return path.tasks.slice(0, 2); // 2 tasks per skill
    }).slice(0, 8)
  };

  // Phase 2: Advanced skills (4 weeks)
  const phase2: LearningPhase = {
    name: "Growth: Advanced Topics",
    duration: "Weeks 5-8",
    skills: highGaps.map(g => g.skill),
    tasks: highGaps.flatMap(gap => {
      const path = generateLearningPath(gap);
      return path.tasks;
    }).slice(0, 9)
  };

  // Phase 3: Portfolio & Practice (4 weeks)
  const phase3: LearningPhase = {
    name: "Portfolio: Real Projects",
    duration: "Weeks 9-12",
    skills: [career.title, "Project Building", "Portfolio Development"],
    tasks: [
      {
        id: "portfolio-1",
        type: "Project Idea",
        title: `Build a real-world ${career.title} project`,
        description: `Create a significant project that demonstrates mastery of ${career.requiredSkills.join(", ")}. Deploy it and add to your portfolio.`,
        relatedSkill: career.title
      },
      {
        id: "portfolio-2",
        type: "Project Idea",
        title: "Contribute to open source",
        description: `Find an open source project related to ${career.title} and make meaningful contributions.`,
        relatedSkill: "Open Source"
      },
      {
        id: "portfolio-3",
        type: "Learning Material",
        title: "Build professional portfolio/resume",
        description: "Showcase your projects, skills, and achievements on a portfolio website or LinkedIn.",
        relatedSkill: "Career Readiness"
      }
    ]
  };

  // Phase 4: Interview prep (2 weeks)
  const phase4: LearningPhase = {
    name: "Ready: Interview Preparation",
    duration: "Weeks 13-14",
    skills: ["Interview Prep", "System Design", "Problem Solving"],
    tasks: [
      {
        id: "interview-1",
        type: "Practice Exercise",
        title: "Practice technical interview questions",
        description: "Solve 20+ typical interview problems for your target role.",
        relatedSkill: "Interview Prep"
      },
      {
        id: "interview-2",
        type: "Learning Material",
        title: "Study system design patterns",
        description: "Learn how to approach and design systems in interviews.",
        relatedSkill: "System Design"
      }
    ]
  };

  const phases = [phase1, phase2, phase3, phase4];
  const allResources = new Set<string>();

  skillGaps.forEach(gap => {
    getLearningResources(gap.skill).forEach(r => allResources.add(r));
  });

  return {
    career,
    totalWeeks: 14,
    phases,
    resources: Array.from(allResources).slice(0, 15)
  };
}

/**
 * Suggest next learning task based on profile
 */
export function getNextLearningTask(
  skillGaps: SkillGap[]
): LearningTask | null {
  if (skillGaps.length === 0) {
    return {
      id: "advanced-1",
      type: "Project Idea",
      title: "Build an advanced portfolio project",
      description: "Since you've covered the basics, work on an ambitious project that showcases innovation and mastery.",
      relatedSkill: "Advanced Development"
    };
  }

  // Get the highest priority gap
  const highestPriority = skillGaps[0];
  const path = generateLearningPath(highestPriority);
  
  return path.tasks[0] || null;
}
