import { useMemo, useState } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import { generateInterviewQuestions } from "../services/matchingService";

export function InterviewPrepPage() {
  const { state } = useCareerMithra();
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [userResponse, setUserResponse] = useState("");

  const upcomingInterviews = state.applications.filter(
    (app) => app.status === "Interview",
  );
  const selectedInterview = upcomingInterviews[0];

  const interviewQuestions = selectedInterview
    ? generateInterviewQuestions(
        state.opportunities.find(
          (op) => op.id === selectedInterview.opportunityId,
        )!,
      )
    : [];

  const focusSkills = useMemo(
    () => selectedInterview?.missingSkills.slice(0, 4) || [],
    [selectedInterview],
  );

  const mockAnswers: Record<string, string> = {
    "Tell me about yourself and why you are interested in this role.":
      "I have 3 years of experience in software development focusing on frontend technologies. I am interested in this role because it matches my background and the team works on products I would like to learn from.",
    "What experience do you have with the required technologies?":
      "I have built multiple production applications using React and TypeScript. I regularly contribute to open-source projects and follow industry best practices.",
    "Describe a challenging project you have worked on.":
      "I led the redesign of a dashboard that initially had performance issues. We reduced load time significantly through code optimization and a better caching strategy.",
    "How do you handle feedback and criticism?":
      "I treat feedback as an opportunity to improve. In my last role, I took comments from senior engineers and used them to refine the codebase and delivery process.",
    "Why do you want to work for us?":
      "I admire the mission and the technical quality of the team. The role lines up with my skills, and I want to contribute to meaningful products while growing with the team.",
  };

  const currentQuestion = interviewQuestions[selectedQuestion];
  const currentAnswer =
    mockAnswers[currentQuestion] || "Model answer will appear here.";

  const handlePractice = () => {
    const confidence = Math.max(
      50,
      Math.min(
        100,
        Math.round(
          50 + (userResponse.length / 200) * 30 + (confidenceScore / 100) * 20,
        ),
      ),
    );
    setConfidenceScore(confidence);
  };

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero interview-hero">
        <div className="dashboard-hero-copy">
          <span className="page-kicker">INTERVIEW PREP</span>
          <h2>Interview Preparation</h2>
          <p>
            Practice with curated questions, role-specific skill gaps, and a
            structured mock interview loop.
          </p>
        </div>

        <div className="dashboard-hero-panel">
          <article>
            <span>Upcoming</span>
            <strong>{upcomingInterviews.length}</strong>
          </article>
          <article>
            <span>Focus skills</span>
            <strong>{focusSkills.length}</strong>
          </article>
          <article>
            <span>Questions</span>
            <strong>{interviewQuestions.length}</strong>
          </article>
          <article>
            <span>Confidence</span>
            <strong>{confidenceScore}%</strong>
          </article>
        </div>
      </header>

      {!selectedInterview ? (
        <article className="panel feature-panel">
          <h3>No upcoming interviews</h3>
          <p>
            Once you get shortlisted, your interview prep workspace will appear
            here.
          </p>
          <p>
            Complete your profile, apply to strong matches, and revisit this
            page once you receive an interview invite.
          </p>
        </article>
      ) : (
        <>
          <div className="card-grid">
            <article className="panel feature-panel interview-highlight">
              <h3>Upcoming interview</h3>
              <p>
                <strong>Role:</strong> {selectedInterview.title}
              </p>
              <p>
                <strong>Company:</strong> {selectedInterview.company}
              </p>
              <p>
                <strong>Interview Date:</strong> Tomorrow, 10:00 AM
              </p>
              <p>
                <strong>Match score:</strong> {selectedInterview.matchScore}%
              </p>
            </article>

            <article className="panel feature-panel">
              <h3>What to focus on</h3>
              <ul className="plain-list">
                {focusSkills.length > 0 ? (
                  focusSkills.map((skill) => <li key={skill}>{skill}</li>)
                ) : (
                  <li>
                    Review the job description and your strongest projects.
                  </li>
                )}
              </ul>
            </article>
          </div>

          <div className="card-grid">
            <article className="panel feature-panel">
              <h3>Interview topics to study</h3>
              <ul className="plain-list">
                <li>Data Structures & Algorithms</li>
                <li>System Design</li>
                <li>Behavioral Questions</li>
                <li>Company Research</li>
                <li>Technical Deep Dive</li>
              </ul>
            </article>

            <article className="panel feature-panel">
              <h3>Preparation checklist</h3>
              <div className="prep-checklist">
                <label className="checkbox-row">
                  <input type="checkbox" defaultChecked />
                  Data Structures & Algorithms
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" defaultChecked />
                  System Design
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" />
                  Behavioral Questions
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" />
                  Company Research
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" />
                  Technical Deep Dive
                </label>
              </div>
              <p className="prep-progress">65% Complete</p>
            </article>
          </div>

          <article className="panel feature-panel">
            <h3>Mock interview practice</h3>

            <div className="question-tabs-wrap">
              <div className="question-tabs">
                {interviewQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedQuestion(idx);
                      setUserResponse("");
                      setConfidenceScore(0);
                    }}
                    className={`question-tab ${selectedQuestion === idx ? "active" : ""}`}
                  >
                    Q{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <h4 className="question-title">Question {selectedQuestion + 1}:</h4>
            <p className="question-text">{currentQuestion}</p>

            <label className="input-block">
              Your response (2-3 minutes):
              <textarea
                rows={5}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Record or type your response here..."
              />
            </label>

            <label className="input-block">
              Your confidence level:
              <input
                type="range"
                min="0"
                max="100"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
              />
              <span className="confidence-number">{confidenceScore}%</span>
            </label>

            <button className="primary-button" onClick={handlePractice}>
              Get feedback
            </button>

            {confidenceScore > 0 && (
              <div className="feedback-chip">
                <p>Confidence Score: {confidenceScore}%</p>
              </div>
            )}

            <div className="model-answer">
              <h4>Model answer</h4>
              <p>{currentAnswer}</p>
              <p className="model-answer-note">
                Focus on impact, specific examples, and company research.
              </p>
            </div>
          </article>
        </>
      )}
    </section>
  );
}
