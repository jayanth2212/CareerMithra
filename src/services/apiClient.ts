import type {
  ApplicationRecord,
  ApplicationStatus,
  JobOpportunity,
  OnboardingProfile,
  UserAccount,
} from "../types";

/* =========================================
  🌐 BACKEND API CLIENT
========================================= */

interface AuthResponse {
  token: string;
  user: {
    fullName: string;
    email: string;
    onboardingComplete?: boolean;
    profile?: OnboardingProfile | null;
  };
}

interface ProfileResponse {
  onboardingComplete: boolean;
  profile: OnboardingProfile | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function assertValidEmail(email: string): string {
  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  return normalizedEmail;
}

async function parseError(response: Response): Promise<string> {
  const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
  return errorData?.error || `Request failed (HTTP ${response.status})`;
}

/* =========================================
   🔐 REGISTER USER
========================================= */
export async function registerUser(
  account: UserAccount
): Promise<AuthResponse> {
  const normalizedEmail = assertValidEmail(account.email);

  const normalizedAccount = {
    ...account,
    email: normalizedEmail,
  };

  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizedAccount),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AuthResponse;
}

/* =========================================
   🔐 LOGIN USER
========================================= */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const normalizedEmail = assertValidEmail(email);

  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AuthResponse;
}

/* =========================================
   📄 PROFILE (BACKEND)
========================================= */
export async function fetchUserProfile(
  token: string
): Promise<ProfileResponse> {
  const response = await fetch(`${BACKEND_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as ProfileResponse;
}

export async function saveUserProfile(
  token: string,
  profile: OnboardingProfile
): Promise<ProfileResponse> {
  const response = await fetch(`${BACKEND_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as ProfileResponse;
}

/* =========================================
   📊 APPLICATIONS (BACKEND)
========================================= */
export async function fetchApplications(
  token: string
): Promise<ApplicationRecord[]> {
  const response = await fetch(`${BACKEND_URL}/api/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { applications?: ApplicationRecord[] };
  return Array.isArray(data.applications) ? data.applications : [];
}

export async function createApplication(
  token: string,
  payload: Omit<ApplicationRecord, "id">
): Promise<ApplicationRecord> {
  const response = await fetch(`${BACKEND_URL}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { application?: ApplicationRecord };
  if (!data.application) {
    throw new Error("Invalid application response from server");
  }

  return data.application;
}

export async function updateApplicationStatusApi(
  token: string,
  id: string,
  status: ApplicationStatus
): Promise<ApplicationRecord> {
  const response = await fetch(`${BACKEND_URL}/api/applications/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { application?: ApplicationRecord };
  if (!data.application) {
    throw new Error("Invalid application response from server");
  }

  return data.application;
}

/* =========================================
   💼 JOBS (BACKEND WITH FALLBACK)
========================================= */
const FALLBACK_JOBS: JobOpportunity[] = [
  {
    id: "job-1",
    title: "Frontend Engineer - React",
    company: "Google",
    location: "Mountain View, CA",
    type: "Job",
    requiredSkills: ["React", "JavaScript", "TypeScript", "CSS"],
    description: "Build scalable frontend applications for Google Search and Cloud.",
    deadline: "2026-06-30",
  },
  {
    id: "job-2",
    title: "Backend Engineer - Python",
    company: "Microsoft",
    location: "Redmond, WA",
    type: "Job",
    requiredSkills: ["Python", "SQL", "REST API", "Docker"],
    description: "Design and develop backend services for Azure cloud platform.",
    deadline: "2026-07-15",
  },
  {
    id: "job-3",
    title: "Full Stack Developer",
    company: "Amazon",
    location: "Seattle, WA",
    type: "Job",
    requiredSkills: ["JavaScript", "Node.js", "React", "AWS"],
    description: "Work on AWS console and internal tools using full stack technologies.",
    deadline: "2026-07-10",
  },
];

export async function fetchJobsFromApi(): Promise<JobOpportunity[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/jobs`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const jobs = (await response.json()) as JobOpportunity[];
    return Array.isArray(jobs) && jobs.length > 0 ? jobs : FALLBACK_JOBS;
  } catch (error) {
    console.warn("Failed to fetch jobs from backend, using fallback data:", error);
    return FALLBACK_JOBS;
  }
}

interface ApplicationEmailPayload {
  toEmail: string;
  fullName: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export async function sendApplicationSummaryEmail(
  payload: ApplicationEmailPayload
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/notifications/application-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorData?.error || "Failed to send application email");
  }
}