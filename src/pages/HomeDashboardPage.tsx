import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  APPLY_THRESHOLD,
  calculateMatchScore,
} from "../services/matchingService";

export function HomeDashboardPage() {
  const { state } = useCareerMithra();
  const selectedCareer = state.recommendedCareers.find(
    (career) => career.id === state.selectedCareerId,
  );

  const profileCompletion = useMemo(() => {
    const sections = [
      state.profile.education,
      state.profile.projects,
      state.profile.achievements,
      state.profile.experience,
      state.profile.certifications,
    ];

    const filledSections = sections.filter(
      (section) => section.trim().length > 0,
    ).length;
    const skillBonus = state.profile.skills.length > 0 ? 1 : 0;
    const resumeBonus = state.profile.resumeText.trim().length > 0 ? 1 : 0;

    return Math.round(((filledSections + skillBonus + resumeBonus) / 7) * 100);
  }, [state.profile]);

  const topMatches = useMemo(
    () =>
      [...state.opportunities]
        .map((opportunity) => ({
          opportunity,
          match: calculateMatchScore(state.profile, opportunity),
        }))
        .sort((left, right) => right.match.score - left.match.score)
        .slice(0, 3),
    [state.opportunities, state.profile],
  );

  const readyToApply = topMatches.filter(
    (item) => item.match.score >= APPLY_THRESHOLD,
  ).length;
  const nextBestMatch = topMatches[0];
  const firstName = (state.user?.fullName || "there").split(" ")[0];

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">OVERVIEW</span>
          <h2>Welcome back, {firstName}</h2>
          <p>
            Your workspace is centered on the next best move: match jobs, close
            skill gaps, and prepare for interviews.
          </p>
          <div className="hero-actions">
            <Link to="/job-discovery" className="primary-button">
              Explore matching jobs
            </Link>
            <Link to="/resume-preparation" className="ghost-button">
              Improve resume
            </Link>
            <Link to="/interview-prep" className="ghost-button">
              Practice interview
            </Link>
          </div>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Readiness</span>
            <strong>{state.readinessScore}%</strong>
          </article>
          <article>
            <span>Profile complete</span>
            <strong>{profileCompletion}%</strong>
          </article>
          <article>
            <span>Ready to apply</span>
            <strong>{readyToApply}</strong>
          </article>
          <article>
            <span>Applications</span>
            <strong>{state.applications.length}</strong>
          </article>
        </div>
      </header>

      <div className="dashboard-stats-grid">
        <article className="panel metric-panel">
          <p className="stat-label">Readiness Score</p>
          <p className="metric-value">{state.readinessScore}%</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${state.readinessScore}%` }}
            />
          </div>
        </article>
        <article className="panel metric-panel">
          <p className="stat-label">Profile Completion</p>
          <p className="metric-value">{profileCompletion}%</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </article>
        <article className="panel metric-panel">
          <p className="stat-label">Strong Matches</p>
          <p className="metric-value">{readyToApply}</p>
        </article>
        <article className="panel metric-panel">
          <p className="stat-label">Applications</p>
          <p className="metric-value">{state.applications.length}</p>
        </article>
      </div>

      <div className="card-grid">
        <article className="panel feature-panel dashboard-focus-panel">
          <h3>Next action</h3>
          <p>
            {nextBestMatch
              ? `Your best current match is ${nextBestMatch.opportunity.title} at ${nextBestMatch.opportunity.company}.`
              : "Refresh jobs to find your next best opening."}
          </p>
          {nextBestMatch && (
            <>
              <div className="match-line good">
                Matched skills:{" "}
                {nextBestMatch.match.matchedSkills.join(", ") || "None yet"}
              </div>
              <div className="match-line missing">
                Missing skills:{" "}
                {nextBestMatch.match.missingSkills.join(", ") || "None"}
              </div>
              <Link className="text-link" to="/job-discovery">
                Review this opportunity
              </Link>
            </>
          )}
        </article>

        <article className="panel feature-panel">
          <h3>Profile snapshot</h3>
          <p>
            <strong>Experience:</strong>{" "}
            {state.profile.experience || "Not provided"}
          </p>
          <p>
            <strong>Education:</strong>{" "}
            {state.profile.education || "Not provided"}
          </p>
          <p>
            <strong>Top skills:</strong>{" "}
            {state.profile.skills.slice(0, 5).join(", ") || "None yet"}
          </p>
          <p>
            <strong>Selected path:</strong>{" "}
            {selectedCareer?.title || "Not selected"}
          </p>
        </article>

        <article className="panel feature-panel">
          <h3>Top matches</h3>
          {topMatches.length === 0 ? (
            <p>Refresh jobs to see real-time matches here.</p>
          ) : (
            <div className="match-list">
              {topMatches.map(({ opportunity, match }) => (
                <article key={opportunity.id} className="match-item">
                  <div className="row-between">
                    <div>
                      <h4>{opportunity.title}</h4>
                      <p>{opportunity.company}</p>
                    </div>
                    <div className="match-badge high">{match.score}%</div>
                  </div>
                  <p className="match-line good">
                    {match.matchedSkills.join(", ") || "No matched skills yet"}
                  </p>
                  <p className="match-line missing">
                    {match.missingSkills.join(", ") || "No major gaps"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel feature-panel">
          <h3>Guidance loop</h3>
          <ul className="plain-list">
            <li>Review your strongest job match before applying.</li>
            <li>Use resume studio to tighten missing skills and keywords.</li>
            <li>
              Open interview prep once you have a shortlist or interview invite.
            </li>
            <li>Keep one roadmap task active to keep readiness growing.</li>
          </ul>
          <Link to="/continuous-guidance" className="text-link">
            Open guidance
          </Link>
        </article>
      </div>
    </section>
  );
}
