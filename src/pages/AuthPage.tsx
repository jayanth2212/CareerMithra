import { useState, type FormEvent } from "react";
import { useCareerMithra } from "../context/useCareerMithra";

export function AuthPage() {
  const { register, login } = useCareerMithra();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const featureCards = [
    {
      title: "User Authentication & Profile",
      description:
        "Secure JWT-based authentication with profile management. Store your resume, track your progress, and manage your job applications in one place.",
      tone: "blue",
    },
    {
      title: "Resume Upload & Processing",
      description:
        "Upload your PDF resume and let our AI extract key information. PyMuPDF-powered text extraction ensures accurate parsing of your experience and skills.",
      tone: "green",
    },
    {
      title: "Predefined Job Listings",
      description:
        "Access 20 carefully curated job roles with detailed descriptions and required skills. Each job is analyzed to provide accurate matching criteria.",
      tone: "amber",
    },
    {
      title: "AI Matching & Scoring",
      description:
        "Our intelligent engine compares your resume against job requirements using embeddings technology. Get a comprehensive match score from 0-100%.",
      tone: "violet",
    },
    {
      title: "Skill Gap Analysis",
      description:
        "Identify missing skills and receive actionable improvement suggestions. Get personalized learning recommendations to bridge your skill gaps.",
      tone: "pink",
    },
    {
      title: "Smart Application System",
      description:
        "Apply confidently when your match score exceeds 75%. Single or multi-job applications with user-controlled consent - no auto-apply without your approval.",
      tone: "cyan",
    },
    {
      title: "Email Notifications",
      description:
        "Stay informed with automatic email notifications when you apply for jobs and when your application status updates. Never miss an important update.",
      tone: "indigo",
    },
    {
      title: "Email Monitoring (IMAP)",
      description:
        "Our system reads your inbox to detect recruiter replies and automatically updates your application status. Stay on top of all communications.",
      tone: "teal",
    },
    {
      title: "Deadline & Assessment Tracker",
      description:
        "Track assessment dates and interview deadlines with smart reminders. Never miss an important deadline again with our proactive notification system.",
      tone: "purple",
    },
  ];

  const journeySteps = [
    [
      "01",
      "Register / Login",
      "Create your account with secure JWT authentication",
    ],
    [
      "02",
      "Upload Resume",
      "Upload your PDF resume for AI-powered text extraction",
    ],
    [
      "03",
      "Select Job",
      "Choose from 20 predefined job roles that match your interests",
    ],
    ["04", "AI Analysis", "Get match score and detailed skill gap analysis"],
    [
      "05",
      "Get Suggestions",
      "Receive personalized recommendations to improve your profile",
    ],
    ["06", "Apply", "Submit applications with confidence when ready"],
    [
      "07",
      "Email Notification",
      "Receive confirmation and stay updated on your applications",
    ],
    [
      "08",
      "Dashboard Tracking",
      "Monitor your application status in real-time",
    ],
  ];

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "register") {
      if (!fullName) {
        setError("Full name is required for registration.");
        return;
      }
      const ok = await register({ fullName, email, password });
      if (!ok) {
        setError("Registration failed. Try another email or try again.");
      }
      return;
    }

    const ok = await login(email, password);
    if (!ok) {
      setError(
        "Invalid credentials. Register first or check email and password.",
      );
    }
  };

  const scrollToAuth = () => {
    const section = document.getElementById("auth-access");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="landing-page">
      <section className="landing-hero" id="overview">
        <header className="landing-nav-wrap">
          <div className="landing-brand">CareerMithra</div>
          <nav className="landing-nav">
            <a href="#overview">Overview</a>
            <a href="#features">Features</a>
            <a href="#user-flow">User Flow</a>
            <a href="#analytics">Analytics</a>
            <a href="#tracking">Tracking</a>
            <a href="#interview">Interview Prep</a>
          </nav>
          <button type="button" className="landing-cta" onClick={scrollToAuth}>
            Get Started
          </button>
        </header>

        <div className="landing-hero-grid">
          <div>
            <span className="landing-pill">AI-Powered Career Intelligence</span>
            <h1 className="landing-title">
              Your AI Career Assistant
              <br />
              <span>for Job Success</span>
            </h1>
            <p className="landing-subtitle">
              Evaluate your job readiness, identify skill gaps, and track your
              application journey with intelligent AI guidance. Transform how
              you approach your career.
            </p>

            <div className="landing-actions">
              <button
                type="button"
                className="landing-cta"
                onClick={scrollToAuth}
              >
                Start Your Journey
              </button>
              <a className="landing-outline" href="#features">
                Explore Features
              </a>
            </div>

            <div className="landing-proof">
              <div className="landing-avatars">
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <span>D</span>
              </div>
              <strong>2,000+ Students Prepared</strong>
            </div>
          </div>

          <div className="score-panel-wrap">
            <article className="score-panel">
              <div className="score-header">
                <div>
                  <p>Match Score</p>
                  <h3>Software Engineer</h3>
                </div>
              </div>
              <div className="score-ring">85%</div>
              <ul>
                <li>Skills Match</li>
                <li>Experience</li>
                <li>Education</li>
              </ul>
            </article>
            <div className="floating-card top">Application Sent</div>
            <div className="floating-card bottom">Interview Tomorrow</div>
          </div>
        </div>
      </section>

      <section className="landing-section overview-panel">
        <span className="section-pill">PRODUCT OVERVIEW</span>
        <h2>Transform Your Job Search with AI</h2>
        <p>
          CareerMithra is an AI-powered career assistant that helps students and
          fresh graduates evaluate their job readiness, identify skill gaps, and
          navigate their application journey with intelligent guidance.
        </p>

        <div className="problem-solution-grid">
          <article className="problem-card">
            <h3>The Problem</h3>
            <ul>
              <li>No clarity on job readiness</li>
              <li>Apply blindly without understanding skill gaps</li>
              <li>No centralized tracking of applications</li>
              <li>Miss deadlines for assessments/interviews</li>
              <li>Lack of guidance after applying</li>
            </ul>
          </article>

          <article className="solution-card">
            <h3>Our Solution</h3>
            <ul>
              <li>Evaluates resume vs job requirements</li>
              <li>Provides score + gap analysis</li>
              <li>Guides whether to apply or improve</li>
              <li>Tracks applications and responses</li>
              <li>Helps prepare for interviews</li>
              <li>Monitors deadlines and progress</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-section features-panel" id="features">
        <span className="section-pill">CORE FEATURES</span>
        <h2>Everything You Need to Land Your Dream Job</h2>
        <p>
          From resume analysis to interview preparation, CareerMithra provides a
          complete toolkit for your job search journey.
        </p>

        <div className="feature-grid">
          {featureCards.map((feature) => (
            <article key={feature.title} className="feature-card">
              <span className={`feature-icon ${feature.tone}`} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section journey-panel" id="user-flow">
        <h2>Your Journey to Success</h2>
        <p>
          Follow our guided process from resume upload to job offer. Each step
          is designed to maximize your chances of success.
        </p>
        <div className="journey-grid">
          {journeySteps.map(([step, title, text]) => (
            <article key={step} className="journey-card">
              <span className="journey-step">{step}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section analytics-panel" id="analytics">
        <h2>Live Analytics Snapshot</h2>
        <p>
          Monitor trends in resume analysis, user adoption, and application
          outcomes from one unified dashboard.
        </p>

        <div className="analytics-grid">
          <div className="analytics-chart">
            <h3>Application Trends</h3>
            <div className="chart-bars">
              <span style={{ height: "42%" }} />
              <span style={{ height: "54%" }} />
              <span style={{ height: "36%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "58%" }} />
              <span style={{ height: "72%" }} />
              <span style={{ height: "64%" }} />
            </div>
          </div>
          <div className="analytics-stats">
            <article>
              <h3>+128</h3>
              <p>New Users this week</p>
            </article>
            <article>
              <h3>342</h3>
              <p>Resumes Analyzed</p>
            </article>
            <article>
              <h3>2.4s</h3>
              <p>Avg. Response Time</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section tracking-panel" id="tracking">
        <h2>Track Every Application</h2>
        <p>
          Never lose track of your job applications again. Our Kanban-style
          dashboard helps you visualize and manage your entire application
          pipeline.
        </p>

        <div className="kanban-grid">
          <article className="kanban-column">
            <h3>Applied</h3>
            <p>Google, Microsoft, Amazon</p>
          </article>
          <article className="kanban-column">
            <h3>Interview</h3>
            <p>Meta, Netflix</p>
          </article>
          <article className="kanban-column">
            <h3>Selected</h3>
            <p>Stripe</p>
          </article>
          <article className="kanban-column">
            <h3>Rejected</h3>
            <p>Apple</p>
          </article>
        </div>
      </section>

      <section className="landing-section interview-panel" id="interview">
        <div>
          <span className="section-pill dark">INTERVIEW PREPARATION</span>
          <h2>Ace Your Interviews</h2>
          <p>
            Comprehensive interview preparation tools to help you confidently
            tackle any interview. From technical questions to behavioral
            scenarios, we have got you covered.
          </p>

          <ul className="interview-list">
            <li>Interview Questions</li>
            <li>Topics to Study</li>
            <li>Preparation Roadmap</li>
          </ul>
          <button type="button" className="landing-cta" onClick={scrollToAuth}>
            Start Preparing
          </button>
        </div>

        <article className="interview-checklist">
          <h3>Interview Prep Checklist</h3>
          <ul>
            <li className="done">DSA & Algorithms</li>
            <li className="done">Behavioral Questions</li>
            <li className="done">Company Research</li>
            <li>Technical Deep Dive</li>
            <li>Mock Interviews</li>
          </ul>
          <div className="confidence-score">
            <strong>85%</strong>
            <span>Confidence Score</span>
          </div>
        </article>
      </section>

      <section className="landing-section auth-access" id="auth-access">
        <div className="auth-card-wrap">
          <h2>{mode === "register" ? "Create Account" : "Log In"}</h2>
          <p>
            {mode === "register"
              ? "Start your journey with personalized career guidance."
              : "Welcome back. Continue your job success journey."}
          </p>

          <form className="auth-form" onSubmit={onSubmit}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-button">
              {mode === "register" ? "Register & Continue" : "Login"}
            </button>

            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setMode((current) =>
                  current === "register" ? "login" : "register",
                )
              }
            >
              {mode === "register"
                ? "Have an account? Log in"
                : "Need an account? Register"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
