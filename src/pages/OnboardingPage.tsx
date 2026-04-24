import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import { parseResumePDF } from "../utils/resumeParser";

export function OnboardingPage() {
  const { state, completeOnboarding } = useCareerMithra();

  const [education, setEducation] = useState(state.profile.education || "");
  const [skills, setSkills] = useState(state.profile.skills.join(", "));
  const [projects, setProjects] = useState(state.profile.projects || "");
  const [achievements, setAchievements] = useState(
    state.profile.achievements || "",
  );
  const [experience, setExperience] = useState(state.profile.experience || "");
  const [certifications, setCertifications] = useState(
    state.profile.certifications || "",
  );
  const [resumeText, setResumeText] = useState(state.profile.resumeText);
  const [assessmentEnabled, setAssessmentEnabled] = useState(false);
  const [aptitudeScore, setAptitudeScore] = useState("");
  const [personalityType, setPersonalityType] = useState("");

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const profileCompletion = useMemo(() => {
    const fields = [
      education,
      skills,
      projects,
      achievements,
      experience,
      certifications,
      resumeText,
    ];
    const filled = fields.filter((field) => field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [
    education,
    skills,
    projects,
    achievements,
    experience,
    certifications,
    resumeText,
  ]);

  const onResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setResumeLoading(true);
    setResumeError("");

    try {
      const parsed = await parseResumePDF(file);
      setResumeText(parsed.resumeText);
      if (parsed.education) {
        setEducation(parsed.education);
      }
      if (parsed.inferredSkills.length > 0) {
        setSkills(parsed.inferredSkills.join(", "));
      }
      if (parsed.projects) {
        setProjects(parsed.projects);
      }
      if (parsed.achievements) {
        setAchievements(parsed.achievements);
      }
      if (parsed.experience) {
        setExperience(parsed.experience);
      }
      if (parsed.certifications) {
        setCertifications(parsed.certifications);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse resume";
      setResumeError(message);
      console.error("Resume parsing failed:", error);
    } finally {
      setResumeLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await completeOnboarding({
      education,
      skills: skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      projects,
      achievements,
      experience,
      certifications,
      assessmentEnabled,
      aptitudeScore: assessmentEnabled ? Number(aptitudeScore || 0) : undefined,
      personalityType: assessmentEnabled ? personalityType : undefined,
      resumeText,
    });
  };

  return (
    <section className="panel onboarding-panel onboarding-shell">
      <div className="onboarding-header">
        <h2>Profile Onboarding</h2>
        <p>
          Upload your resume and verify extracted sections before continuing.
        </p>
      </div>

      <div className="metric-card onboarding-metric">
        <span>Profile Completion</span>
        <strong>{profileCompletion}%</strong>
      </div>

      <form className="grid-form onboarding-grid" onSubmit={onSubmit}>
        <article className="onboarding-card">
          <label>
            Upload resume (PDF)
            <input type="file" accept=".pdf" onChange={onResumeUpload} />
          </label>

          {resumeLoading && (
            <p className="resume-status loading">Parsing resume...</p>
          )}
          {resumeError && (
            <p className="resume-status error">Error: {resumeError}</p>
          )}

          <label>
            Resume text (editable)
            <textarea
              rows={10}
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste resume content here for parsing and personalization."
              required
            />
          </label>
        </article>

        <article className="onboarding-card">
          <label>
            Education
            <textarea
              rows={3}
              value={education}
              onChange={(event) => setEducation(event.target.value)}
              required
            />
          </label>

          <label>
            Skills (comma separated)
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              required
            />
          </label>

          <label>
            Projects
            <textarea
              rows={3}
              value={projects}
              onChange={(event) => setProjects(event.target.value)}
            />
          </label>

          <label>
            Achievements
            <textarea
              rows={3}
              value={achievements}
              onChange={(event) => setAchievements(event.target.value)}
            />
          </label>

          <label>
            Experience (if any)
            <textarea
              rows={3}
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </label>

          <label>
            Certifications
            <textarea
              rows={3}
              value={certifications}
              onChange={(event) => setCertifications(event.target.value)}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={assessmentEnabled}
              onChange={(event) => setAssessmentEnabled(event.target.checked)}
            />
            Enable optional assessment module
          </label>

          {assessmentEnabled && (
            <>
              <label>
                Aptitude score (0-100)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={aptitudeScore}
                  onChange={(event) => setAptitudeScore(event.target.value)}
                />
              </label>

              <label>
                Personality type
                <input
                  value={personalityType}
                  onChange={(event) => setPersonalityType(event.target.value)}
                  placeholder="Example: INTJ"
                />
              </label>
            </>
          )}

          <button type="submit" className="primary-button">
            Complete Onboarding
          </button>
        </article>
      </form>
    </section>
  );
}
