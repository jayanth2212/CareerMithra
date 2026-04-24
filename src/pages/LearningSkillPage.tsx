import { useMemo } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  identifySkillGaps,
  categorizeProfileSkills,
} from "../services/skillsAnalyzer";
import {
  generateCareerLearningPlan,
  getNextLearningTask,
  getLearningResources,
  type LearningPhase,
} from "../services/learningPathGenerator";
import type { LearningTask } from "../types";

export function LearningSkillPage() {
  const { state } = useCareerMithra();

  const selectedCareer = useMemo(() => {
    return state.recommendedCareers.find(
      (career) => career.id === state.selectedCareerId,
    );
  }, [state.recommendedCareers, state.selectedCareerId]);

  const skillGaps = useMemo(() => {
    if (!selectedCareer) {
      return [];
    }
    return identifySkillGaps(state.profile.skills, state.opportunities);
  }, [selectedCareer, state.profile.skills, state.opportunities]);

  const careerLearningPlan = useMemo(() => {
    if (!selectedCareer) return null;
    return generateCareerLearningPlan(selectedCareer, state.profile, skillGaps);
  }, [selectedCareer, state.profile, skillGaps]);

  const nextTask = useMemo(() => {
    return getNextLearningTask(skillGaps);
  }, [skillGaps]);

  const skillCategories = useMemo(() => {
    return categorizeProfileSkills(state.profile.skills);
  }, [state.profile.skills]);

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero learning-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">SKILL LAB</span>
          <h2>Learning & Skill Development</h2>
          <p>
            Personalized learning paths and resources tailored to your career
            goal.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Current skills</span>
            <strong>{state.profile.skills.length}</strong>
          </article>
          <article>
            <span>Skill gaps</span>
            <strong>{skillGaps.length}</strong>
          </article>
          <article>
            <span>Learning phase</span>
            <strong>{careerLearningPlan ? "Active" : "Setup"}</strong>
          </article>
          <article>
            <span>Career focus</span>
            <strong>{selectedCareer?.title || "None"}</strong>
          </article>
        </div>
      </header>

      {/* Skill Categories Overview */}
      <article className="panel skill-overview">
        <h3>🎯 Your Current Skills</h3>
        <div className="skill-categories-display">
          {skillCategories.technical.length > 0 && (
            <div className="skill-category-section">
              <strong className="category-label">
                Technical ({skillCategories.technical.length})
              </strong>
              <div className="skill-chips">
                {skillCategories.technical.map((s) => (
                  <span key={s} className="skill-chip technical">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skillCategories.frameworks.length > 0 && (
            <div className="skill-category-section">
              <strong className="category-label">
                Frameworks ({skillCategories.frameworks.length})
              </strong>
              <div className="skill-chips">
                {skillCategories.frameworks.map((s) => (
                  <span key={s} className="skill-chip frameworks">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skillCategories.tools.length > 0 && (
            <div className="skill-category-section">
              <strong className="category-label">
                Tools ({skillCategories.tools.length})
              </strong>
              <div className="skill-chips">
                {skillCategories.tools.map((s) => (
                  <span key={s} className="skill-chip tools">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skillCategories.soft.length > 0 && (
            <div className="skill-category-section">
              <strong className="category-label">
                Soft Skills ({skillCategories.soft.length})
              </strong>
              <div className="skill-chips">
                {skillCategories.soft.map((s) => (
                  <span key={s} className="skill-chip soft">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Next Recommended Task */}
      {nextTask && (
        <article className="panel next-task-panel">
          <h3>🚀 Your Next Priority</h3>
          <div className="task-card">
            <div className="task-type-badge">{nextTask.type}</div>
            <h4>{nextTask.title}</h4>
            <p>{nextTask.description}</p>
            <button className="primary-button" style={{ marginTop: "0.8rem" }}>
              Start Learning
            </button>
          </div>
        </article>
      )}

      {/* Career Learning Plan */}
      {careerLearningPlan && (
        <article className="panel learning-plan-panel">
          <h3>
            📚 14-Week Learning Plan for {careerLearningPlan.career.title}
          </h3>
          <div className="learning-phases">
            {careerLearningPlan.phases.map(
              (phase: LearningPhase, idx: number) => (
                <div key={idx} className="learning-phase">
                  <div className="phase-header">
                    <strong className="phase-name">{phase.name}</strong>
                    <span className="phase-duration">{phase.duration}</span>
                  </div>
                  <div className="phase-skills">
                    {phase.skills.map((skill: string) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="phase-tasks">
                    {phase.tasks.map((task: LearningTask) => (
                      <div key={task.id} className="mini-task">
                        <span className="task-type-mini">{task.type}</span>
                        <span className="task-title">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </article>
      )}

      {/* Skill Gaps */}
      {skillGaps.length > 0 && (
        <article className="panel skill-gaps-panel">
          <h3>⚡ Skills to Develop</h3>
          <div className="gaps-list">
            {skillGaps.slice(0, 10).map((gap) => {
              const resources = getLearningResources(gap.skill);
              return (
                <div
                  key={gap.skill}
                  className={`gap-card priority-${gap.priority}`}
                >
                  <div className="gap-header">
                    <strong className="gap-skill">{gap.skill}</strong>
                    <span className={`priority-badge ${gap.priority}`}>
                      {gap.priority === "critical" && "Critical"}
                      {gap.priority === "high" && "High Priority"}
                      {gap.priority === "medium" && "Medium"}
                      {gap.priority === "low" && "Nice to have"}
                    </span>
                  </div>
                  <p className="gap-info">
                    {gap.relevantJobs} jobs require this skill
                  </p>
                  <div className="resources-list">
                    <strong>Resources:</strong>
                    <ul className="plain-list">
                      {resources.slice(0, 3).map((res: string) => (
                        <li key={res}>{res}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      )}

      {/* Learning Tasks from State */}
      {state.learningTasks.length > 0 && (
        <article className="panel">
          <h3>📋 Assigned Learning Tasks</h3>
          <div className="card-grid">
            {state.learningTasks.map((task) => (
              <div key={task.id} className="learning-task-card">
                <span className="task-type-badge">{task.type}</span>
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <p className="related-skill">
                  <strong>Skill:</strong> {task.relatedSkill}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* No Career Selected */}
      {!selectedCareer && (
        <article className="panel info-panel">
          <h3>🎯 Get Started</h3>
          <p>
            Select a career path in <strong>Career Insights</strong> to unlock
            your personalized learning roadmap.
          </p>
          <p>Once you select a path, you'll see:</p>
          <ul className="plain-list">
            <li>A 14-week structured learning plan with 4 phases</li>
            <li>Priority skill gaps based on job market demand</li>
            <li>Curated learning resources for each skill</li>
            <li>Personalized next steps to accelerate your growth</li>
          </ul>
        </article>
      )}
    </section>
  );
}
