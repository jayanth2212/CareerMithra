import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCareerMithra } from "../context/useCareerMithra";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/career-insights", label: "Career Insights" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/learning-skill", label: "Skill Lab" },
  { to: "/progress", label: "Progress" },
  { to: "/profile-settings", label: "Profile Settings" },
  { to: "/resume-preparation", label: "Resume Studio" },
  { to: "/job-discovery", label: "Job Discovery" },
  { to: "/application-tracking", label: "My Jobs" },
  { to: "/interview-prep", label: "Interview Prep" },
  { to: "/analytics", label: "Analytics" },
  { to: "/continuous-guidance", label: "Guidance" },
];

export function AppShell() {
  const { state, logout, refreshJobs, jobsLoading } = useCareerMithra();
  const location = useLocation();
  const activeNav =
    navItems.find((item) => item.to === location.pathname)?.label || "Overview";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand-wrap">
          <h1 className="brand">CareerMithra</h1>
          <p className="sidebar-subtitle">Premium Student Career OS</p>
        </div>

        <div className="panel sidebar-panel">
          <div className="sidebar-summary-head">
            <div>
              <p className="sidebar-user-label">Logged in as</p>
              <p className="sidebar-user-name">{state.user?.fullName}</p>
            </div>
            <div className="sidebar-score-pill">
              {state.readinessScore}% ready
            </div>
          </div>

          <div className="sidebar-summary-grid">
            <article>
              <span>Applications</span>
              <strong>{state.applications.length}</strong>
            </article>
            <article>
              <span>Jobs</span>
              <strong>{state.opportunities.length}</strong>
            </article>
            <article>
              <span>Alerts</span>
              <strong>{state.notifications.length}</strong>
            </article>
          </div>

          <div className="sidebar-actions">
            <button
              className="primary-button"
              onClick={refreshJobs}
              disabled={jobsLoading}
            >
              {jobsLoading ? "Refreshing jobs..." : "Refresh jobs"}
            </button>
            <Link className="ghost-button" to="/job-discovery">
              Find matches
            </Link>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user-label">Focus for today</p>
          <p>
            {state.applications.length === 0
              ? "Review your top matches and apply to the strongest fit."
              : "Improve one skill gap and prepare for your next interview."}
          </p>
          <button className="ghost-button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content-area">
        <header className="panel dashboard-topbar">
          <div className="dashboard-topbar-copy">
            <span className="page-kicker">Career Dashboard</span>
            <h2>{activeNav}</h2>
            <p>
              Discover verified opportunities, track applications, and build a
              recruiter-ready profile in one workflow.
            </p>
          </div>

          <div className="dashboard-topbar-actions">
            <label className="dashboard-search-wrap" htmlFor="dashboard-search">
              <span>Job title, skill, company</span>
              <input
                id="dashboard-search"
                placeholder="Try: React, Data Analyst, Python"
                type="search"
              />
            </label>
            <div className="dashboard-quick-actions">
              <Link className="ghost-button" to="/job-discovery">
                View jobs
              </Link>
              <Link className="ghost-button" to="/application-tracking">
                Applied jobs
              </Link>
              <button
                className="primary-button"
                onClick={refreshJobs}
                disabled={jobsLoading}
              >
                {jobsLoading ? "Refreshing..." : "Refresh feed"}
              </button>
            </div>
          </div>
        </header>

        <nav className="dashboard-tabs" aria-label="Dashboard quick navigation">
          {navItems.slice(0, 8).map((item) => (
            <NavLink
              key={`tab-${item.to}`}
              to={item.to}
              className={({ isActive }) =>
                `dashboard-tab ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
    </div>
  );
}
