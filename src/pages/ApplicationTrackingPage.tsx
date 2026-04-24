import { useMemo, useState } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  analyzeApplications,
  getApplicationNextSteps,
  estimateInterviewSuccess,
} from "../services/applicationInsights";
import type { ApplicationStatus } from "../types";

const statuses: ApplicationStatus[] = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Rejected",
  "Selected",
];

const statusColors: Record<ApplicationStatus, string> = {
  Applied: "#e8f0ff",
  Shortlisted: "#e8f5f0",
  Interview: "#fff4e8",
  Selected: "#e8ffe8",
  Rejected: "#ffe8e8",
};

function companyMonogram(company: string): string {
  const parts = company
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return "JB";
  }

  return parts.map((part) => part[0].toUpperCase()).join("");
}

function formatDeadlineLabel(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function ApplicationTrackingPage() {
  const { state, updateApplicationStatus } = useCareerMithra();
  const [searchFilter, setSearchFilter] = useState("");

  const appInsights = useMemo(() => {
    return analyzeApplications(state.applications);
  }, [state.applications]);

  const interviewSuccess = useMemo(() => {
    return estimateInterviewSuccess(state.applications);
  }, [state.applications]);

  const filtered = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    if (!query) {
      return state.applications;
    }

    return state.applications.filter((application) => {
      return (
        application.title.toLowerCase().includes(query) ||
        application.company.toLowerCase().includes(query) ||
        application.status.toLowerCase().includes(query) ||
        application.missingSkills.some((skill) =>
          skill.toLowerCase().includes(query),
        )
      );
    });
  }, [state.applications, searchFilter]);

  return (
    <section className="dashboard-page apps-board-page">
      <header className="panel dashboard-hero apps-board-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">MY APPLICATIONS</span>
          <h2>Application Tracking & Success</h2>
          <p>Track all your applications and get personalized next steps.</p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Total Applied</span>
            <strong>{state.applications.length}</strong>
          </article>
          <article>
            <span>Success Rate</span>
            <strong>{appInsights.successRate}%</strong>
          </article>
          <article>
            <span>Strong Matches</span>
            <strong>{appInsights.strongMatchRate}%</strong>
          </article>
          <article>
            <span>Interview Offers</span>
            <strong>{interviewSuccess.interviews}</strong>
          </article>
        </div>
      </header>

      {/* Application Insights & Applications List */}
      {state.applications.length === 0 ? (
        <article className="panel">
          <p>
            No applications yet. Start from Job Discovery and apply to your
            strongest matches.
          </p>
        </article>
      ) : (
        <>
          {/* Application Insights */}
          <article className="panel apps-insights-panel">
            <div className="insights-header">
              <h3>📊 Your Application Insights</h3>
              <span className="bottleneck-indicator">
                Focus area: {appInsights.keyBottleneck.replace(/_/g, " ")}
              </span>
            </div>

            <div className="insights-metrics">
              <div className="insight-stat">
                <strong>{appInsights.successRate}%</strong>
                <span>Applications advancing</span>
              </div>
              <div className="insight-stat">
                <strong>{appInsights.strongMatchRate}%</strong>
                <span>Strong matches (75%+)</span>
              </div>
              <div className="insight-stat">
                <strong>{interviewSuccess.selectionRate}%</strong>
                <span>Interview to offer rate</span>
              </div>
            </div>

            <div className="recommendations-list">
              <h4>💡 Recommended Actions:</h4>
              <ul className="plain-list">
                {appInsights.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </article>

          {/* Search and Filter */}
          <div className="apps-board-filter-wrap">
            <input
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              placeholder="Search by role, company, or skills..."
              type="search"
            />
          </div>

          {filtered.length === 0 && searchFilter && (
            <article className="panel">
              <p>No applications match your search. Try a different query.</p>
            </article>
          )}

          <div className="stacked-list apps-board-list">
            {filtered.map((application) => {
              const nextSteps = getApplicationNextSteps(application);
              const immediateNextStep = nextSteps[0];

              const matchedSkillsSample =
                application.matchedSkills.length > 0
                  ? `Your profile aligns with ${application.matchedSkills.slice(0, 3).join(", ")}.`
                  : `Your profile has baseline alignment for ${application.title}.`;

              const skillGaps =
                application.missingSkills.length > 0
                  ? application.missingSkills
                  : ["No major skill gaps detected"];

              const statusLabel = statuses.includes(application.status)
                ? application.status
                : "Applied";

              return (
                <article
                  key={application.id}
                  className="panel apps-board-card"
                  style={{ borderLeftColor: statusColors[statusLabel] }}
                >
                  <div className="apps-board-card-head">
                    <div className="apps-board-company-mark">
                      <span>{companyMonogram(application.company)}</span>
                    </div>

                    <div className="apps-board-main-copy">
                      <h3>{application.company}</h3>
                      <p className="apps-board-role">{application.title}</p>
                      <div className="apps-board-meta-row">
                        <span>Applied {application.appliedDate}</span>
                        <span>
                          Deadline {formatDeadlineLabel(application.deadline)}
                        </span>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: statusColors[statusLabel] }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="apps-board-score-badge">
                      <strong>{application.matchScore}%</strong>
                      <span>Match</span>
                    </div>
                  </div>

                  <div className="apps-board-progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${application.matchScore}%` }}
                    />
                  </div>

                  <div className="apps-board-insights-grid">
                    <section>
                      <h4>Why you match</h4>
                      <ul className="apps-board-points">
                        <li>{matchedSkillsSample}</li>
                        <li>
                          Next action:{" "}
                          {application.followUpReminder ||
                            "Check email for updates"}
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h4>Skill gaps</h4>
                      <div className="apps-board-gap-tags">
                        {skillGaps.map((gap) => (
                          <span key={gap}>{gap}</span>
                        ))}
                      </div>
                    </section>

                    {immediateNextStep && (
                      <section className="next-step-section">
                        <h4>
                          ⚡ Priority: {immediateNextStep.urgency.toUpperCase()}
                        </h4>
                        <p>
                          <strong>{immediateNextStep.action}</strong>
                        </p>
                        <p>{immediateNextStep.description}</p>
                        {immediateNextStep.resources && (
                          <div className="step-resources">
                            {immediateNextStep.resources
                              .slice(0, 2)
                              .map((res) => (
                                <span key={res} className="resource-tag">
                                  {res}
                                </span>
                              ))}
                          </div>
                        )}
                      </section>
                    )}
                  </div>

                  <div className="apps-board-actions">
                    <select
                      value={application.status}
                      onChange={(event) =>
                        updateApplicationStatus(
                          application.id,
                          event.target.value as ApplicationStatus,
                        )
                      }
                      className="status-select"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
