import { useMemo } from "react";
import { useCareerMithra } from "../context/useCareerMithra";

export function ContinuousGuidancePage() {
  const { state } = useCareerMithra();

  const nextSteps = useMemo(() => {
    const steps: string[] = [];

    if (state.readinessScore < 50) {
      steps.push("Complete one roadmap stage this week to increase readiness.");
    }

    if (state.applications.length < 2) {
      steps.push(
        "Apply to at least two relevant opportunities from Job Discovery.",
      );
    }

    if (!state.profile.resumeText || state.profile.resumeText.length < 150) {
      steps.push(
        "Strengthen resume content with quantified achievements and role keywords.",
      );
    }

    if (steps.length === 0) {
      steps.push(
        "Maintain momentum with mock interviews and weekly reflection updates.",
      );
    }

    return steps;
  }, [state]);

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero guidance-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">CONTINUOUS GUIDANCE</span>
          <h2>Continuous Guidance System</h2>
          <p>
            Adaptive roadmap updates, nudges, and motivational prompts based on
            your progress.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Readiness</span>
            <strong>{state.readinessScore}%</strong>
          </article>
          <article>
            <span>Applications</span>
            <strong>{state.applications.length}</strong>
          </article>
          <article>
            <span>Notifications</span>
            <strong>{state.notifications.length}</strong>
          </article>
          <article>
            <span>Roadmap</span>
            <strong>{state.roadmap.length}</strong>
          </article>
        </div>
      </header>

      <div className="card-grid">
        <article className="panel feature-panel">
          <h3>Adaptive next steps</h3>
          <ul className="plain-list">
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>

        <article className="panel feature-panel">
          <h3>Momentum snapshot</h3>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${state.readinessScore}%` }}
            />
          </div>
          <p>
            {state.readinessScore < 40
              ? "Build one strong foundation task before expanding applications."
              : state.readinessScore < 75
                ? "Keep improving one skill gap and one project story each week."
                : "High momentum. Keep applying and scheduling interviews."}
          </p>
        </article>
      </div>

      <article className="panel">
        <h3>Recent guidance notifications</h3>
        <ul className="plain-list">
          {state.notifications.map((note, index) => (
            <li key={`${note}-${index}`}>{note}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
