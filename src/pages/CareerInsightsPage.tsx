import { useMemo } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  generateCareerRecommendations,
  getCareerActionPlan,
  getSuggestedRoles,
} from "../services/careerRecommender";
import type { CareerRecommendation } from "../services/careerRecommender";

export function CareerInsightsPage() {
  const { state, selectCareerPath } = useCareerMithra();

  const careerRecommendations: CareerRecommendation[] = useMemo(() => {
    return generateCareerRecommendations(
      state.recommendedCareers,
      state.profile,
      state.opportunities,
    );
  }, [state.recommendedCareers, state.profile, state.opportunities]);

  const topCareer = careerRecommendations[0];

  const topCareerActionPlan = useMemo(() => {
    return topCareer ? getCareerActionPlan(topCareer, state.profile) : [];
  }, [topCareer, state.profile]);

  const suggestedRoles = useMemo(() => {
    return topCareer
      ? getSuggestedRoles(topCareer, state.opportunities).slice(0, 3)
      : [];
  }, [topCareer, state.opportunities]);

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero insights-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">CAREER PATHS</span>
          <h2>Career Insights Dashboard</h2>
          <p>
            Use your profile, skills, and current progress to shortlist the most
            realistic next career move.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Recommended</span>
            <strong>{careerRecommendations.length}</strong>
          </article>
          <article>
            <span>Selected path</span>
            <strong>{state.selectedCareerId ? "1" : "0"}</strong>
          </article>
          <article>
            <span>Profile skills</span>
            <strong>{state.profile.skills.length}</strong>
          </article>
          <article>
            <span>Readiness</span>
            <strong>{state.readinessScore}%</strong>
          </article>
        </div>
      </header>

      {/* Top Career with Enhanced Details */}
      {topCareer && (
        <div className="card-grid">
          <article className="panel feature-panel insight-highlight">
            <div className="career-fit-badge">
              <span className="fit-label">Career Fit</span>
              <strong className="fit-score">{topCareer.fitScore}%</strong>
            </div>
            <h3>{topCareer.title}</h3>
            <p>{topCareer.description}</p>

            {/* Skill Match Summary */}
            <div className="skill-match-summary">
              <div className="match-metric">
                <span className="match-label">Matched Skills</span>
                <strong className="match-value">
                  {topCareer.matchedSkillsCount}
                </strong>
              </div>
              <div className="match-metric">
                <span className="match-label">Missing Skills</span>
                <strong className="match-value missing">
                  {topCareer.missingSkillsCount}
                </strong>
              </div>
              <div className="match-metric">
                <span className="match-label">Time to Ready</span>
                <strong className="match-value">{topCareer.timeToReady}</strong>
              </div>
            </div>

            {/* Growth Trend Badge */}
            <div className="growth-indicator">
              <span className={`growth-badge growth-${topCareer.growthTrend}`}>
                {topCareer.growthTrend === "high" && "📈 High Growth"}
                {topCareer.growthTrend === "medium" && "→ Stable Growth"}
                {topCareer.growthTrend === "low" && "📉 Emerging"}
              </span>
              <span className="job-count">
                {topCareer.jobMarketDemand} roles in market
              </span>
            </div>

            <button
              className="primary-button"
              onClick={() => selectCareerPath(topCareer.id)}
            >
              {state.selectedCareerId === topCareer.id
                ? "✓ Selected"
                : "Select this path"}
            </button>
          </article>

          {/* Action Plan */}
          <article className="panel feature-panel">
            <h3>Your Action Plan</h3>
            <ol className="action-plan-list">
              {topCareerActionPlan.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ol>
          </article>
        </div>
      )}

      {/* Suggested Roles */}
      {suggestedRoles.length > 0 && (
        <article className="panel">
          <h3>Open Opportunities</h3>
          <div className="opportunities-grid">
            {suggestedRoles.map((role) => (
              <div key={role.id} className="opportunity-card">
                <h4>{role.title}</h4>
                <p className="company-name">{role.company}</p>
                <p className="role-location">{role.location}</p>
                {role.salary && <p className="salary-badge">{role.salary}</p>}
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Profile Alignment */}
      <article className="panel feature-panel">
        <h3>Your Profile Alignment</h3>
        <div className="profile-section-grid">
          <div className="profile-field">
            <strong>Education</strong>
            <p>{state.profile.education || "Not provided"}</p>
          </div>
          <div className="profile-field">
            <strong>Experience</strong>
            <p>{state.profile.experience || "Not provided"}</p>
          </div>
          <div className="profile-field">
            <strong>Projects</strong>
            <p>{state.profile.projects || "Not provided"}</p>
          </div>
          <div className="profile-field">
            <strong>Certifications</strong>
            <p>{state.profile.certifications || "Not provided"}</p>
          </div>
        </div>
        <p>
          <strong>Top skills:</strong>{" "}
          {state.profile.skills.join(", ") || "None yet"}
        </p>
      </article>

      {/* All Career Recommendations */}
      <div className="stacked-list">
        <h3 style={{ marginTop: "1rem" }}>All Career Paths</h3>
        {careerRecommendations.map((career) => {
          const selected = state.selectedCareerId === career.id;
          return (
            <article key={career.id} className="panel career-card">
              <div className="row-between career-card-header">
                <div>
                  <h3>{career.title}</h3>
                  <div className="career-metrics-inline">
                    <span className="metric-badge">
                      Fit: {career.fitScore}%
                    </span>
                    <span className="metric-badge">
                      Jobs: {career.jobMarketDemand}
                    </span>
                    <span className="metric-badge">{career.timeToReady}</span>
                  </div>
                </div>
                <button
                  className={selected ? "ghost-button" : "primary-button"}
                  onClick={() => selectCareerPath(career.id)}
                >
                  {selected ? "Selected" : "Shortlist"}
                </button>
              </div>
              <p>{career.description}</p>

              {/* Skill match visualization */}
              <div className="skill-match-viz">
                <div className="matched-skills">
                  <strong>✓ Matched ({career.matchedSkillsCount}):</strong>
                  <div className="skills-preview">
                    {career.requiredSkills
                      .slice(0, career.matchedSkillsCount)
                      .map((skill) => (
                        <span key={skill} className="chip matched">
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
                {career.missingSkillsCount > 0 && (
                  <div className="missing-skills">
                    <strong>✗ Missing ({career.missingSkillsCount}):</strong>
                    <div className="skills-preview">
                      {career.requiredSkills
                        .slice(career.matchedSkillsCount)
                        .map((skill) => (
                          <span key={skill} className="chip missing">
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <p>
                <strong>Growth opportunities:</strong>{" "}
                {career.growthOpportunities.join(", ")}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
