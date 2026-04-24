import { useMemo } from "react";
import { useCareerMithra } from "../context/useCareerMithra";

const interviewQuestions = [
  "Tell me about yourself and your career direction.",
  "Describe a challenge you solved and your approach.",
  "Why are you interested in this specific role?",
];

export function ResumePreparationPage() {
  const { state, updateResumeText } = useCareerMithra();

  const selectedCareer = state.recommendedCareers.find(
    (career) => career.id === state.selectedCareerId,
  );

  const suggestions = useMemo(() => {
    if (!selectedCareer) {
      return ["Select a career path to get role-specific resume suggestions."];
    }

    return [
      `Highlight ${selectedCareer.requiredSkills.slice(0, 3).join(", ")} in your top section.`,
      "Include one measurable outcome for each project or internship entry.",
      `Add keywords aligned to ${selectedCareer.title} for stronger ATS matching.`,
    ];
  }, [selectedCareer]);

  return (
    <section className="dashboard-page">
      <header className="section-header">
        <span className="page-kicker">RESUME STUDIO</span>
        <h2>Resume & Preparation Dashboard</h2>
        <p>
          Build your resume, receive suggestions, and prepare for interviews.
        </p>
      </header>

      <article className="panel feature-panel">
        <h3>Resume Builder</h3>
        <textarea
          rows={12}
          value={state.profile.resumeText}
          onChange={(event) => updateResumeText(event.target.value)}
        />
      </article>

      <div className="card-grid">
        <article className="panel">
          <h3>Resume Suggestions</h3>
          <ul className="plain-list">
            {suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Interview Preparation</h3>
          <p>Common questions</p>
          <ul className="plain-list">
            {interviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p>
            <strong>Practice Module:</strong> Record 2-minute responses and
            self-review clarity.
          </p>
          <p>
            <strong>Feedback:</strong> Track confidence, storytelling, and
            relevance after each session.
          </p>
        </article>
      </div>
    </section>
  );
}
