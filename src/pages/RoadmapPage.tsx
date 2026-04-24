import { useCareerMithra } from "../context/useCareerMithra";
import type { TaskStatus } from "../types";

const statuses: TaskStatus[] = ["not started", "in progress", "completed"];

export function RoadmapPage() {
  const { state, updateRoadmapStepStatus } = useCareerMithra();

  return (
    <section className="dashboard-page">
      <header className="section-header">
        <span className="page-kicker">ROADMAP</span>
        <h2>Roadmap Dashboard</h2>
        <p>
          Structured steps from fundamentals to projects with progress controls.
        </p>
      </header>

      <div className="stacked-list">
        {state.roadmap.map((step) => (
          <article key={step.id} className="panel">
            <div className="row-between">
              <h3>{step.stage}</h3>
              <span className="chip">{step.timeline}</span>
            </div>
            <p>{step.title}</p>
            <label>
              Status
              <select
                value={step.status}
                onChange={(event) =>
                  updateRoadmapStepStatus(
                    step.id,
                    event.target.value as TaskStatus,
                  )
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
