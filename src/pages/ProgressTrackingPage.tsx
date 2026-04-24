import { useMemo } from "react";
import { useCareerMithra } from "../context/useCareerMithra";

export function ProgressTrackingPage() {
  const { state } = useCareerMithra();

  const roadmapCompletion = useMemo(() => {
    const completed = state.roadmap.filter(
      (step) => step.status === "completed",
    ).length;
    return Math.round((completed / Math.max(state.roadmap.length, 1)) * 100);
  }, [state.roadmap]);

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero progress-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">PROGRESS</span>
          <h2>Progress Tracking Dashboard</h2>
          <p>
            Milestones, active tasks, readiness metrics, and adaptive
            recommendations.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Completed</span>
            <strong>{state.completedMilestones}</strong>
          </article>
          <article>
            <span>Ongoing</span>
            <strong>{state.ongoingTasks}</strong>
          </article>
          <article>
            <span>Readiness</span>
            <strong>{state.readinessScore}%</strong>
          </article>
          <article>
            <span>Roadmap</span>
            <strong>{roadmapCompletion}%</strong>
          </article>
        </div>
      </header>

      <div className="card-grid">
        <article className="panel feature-panel">
          <h3>Completed milestones</h3>
          <p className="metric-value">{state.completedMilestones}</p>
        </article>

        <article className="panel feature-panel">
          <h3>Ongoing tasks</h3>
          <p className="metric-value">{state.ongoingTasks}</p>
        </article>

        <article className="panel feature-panel">
          <h3>Overall readiness</h3>
          <p className="metric-value">{state.readinessScore}%</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${state.readinessScore}%` }}
            />
          </div>
        </article>
      </div>

      <article className="panel feature-panel">
        <h3>Updated recommendations</h3>
        <ul className="plain-list">
          {state.readinessScore < 40 && (
            <li>
              Focus on roadmap fundamentals before expanding applications.
            </li>
          )}
          {state.readinessScore >= 40 && state.readinessScore < 75 && (
            <li>
              Increase project depth and start interview practice modules.
            </li>
          )}
          {state.readinessScore >= 75 && (
            <li>
              High readiness detected. Scale applications and mock interviews
              this week.
            </li>
          )}
          <li>Roadmap completion is currently {roadmapCompletion}%.</li>
        </ul>
      </article>
    </section>
  );
}
