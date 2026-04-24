import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import { parseResumePDF } from "../utils/resumeParser";
import {
  categorizeProfileSkills,
  assessProfileCompleteness,
} from "../services/skillsAnalyzer";

export function ProfileSettingsPage() {
  const { state, saveProfileSettings } = useCareerMithra();

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
  const [resumeText, setResumeText] = useState(state.profile.resumeText || "");
  const [assessmentEnabled, setAssessmentEnabled] = useState(
    Boolean(state.profile.assessmentEnabled),
  );
  const [aptitudeScore, setAptitudeScore] = useState(
    state.profile.aptitudeScore ? String(state.profile.aptitudeScore) : "",
  );
  const [personalityType, setPersonalityType] = useState(
    state.profile.personalityType || "",
  );

  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const profileAssessment = useMemo(() => {
    const currentProfile = {
      education,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      projects,
      achievements,
      experience,
      certifications,
      assessmentEnabled,
      aptitudeScore: assessmentEnabled ? Number(aptitudeScore || 0) : undefined,
      personalityType: assessmentEnabled ? personalityType : undefined,
      resumeText,
    };
    return assessProfileCompleteness(currentProfile);
  }, [
    education,
    skills,
    projects,
    achievements,
    experience,
    certifications,
    resumeText,
    assessmentEnabled,
    aptitudeScore,
    personalityType,
  ]);

  const skillCategories = useMemo(() => {
    const skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return categorizeProfileSkills(skillList);
  }, [skills]);

  const profileCompletion = profileAssessment.percentage;

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

      setSaveMessage("Resume parsed. Review fields and save your profile.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to parse resume";
      setResumeError(message);
    } finally {
      setResumeLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage("");

    await saveProfileSettings({
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

    setSaveMessage("Profile saved successfully.");
  };

  return (
    <section className="dashboard-page">
      <header className="panel profile-settings-head">
        <div>
          <span className="page-kicker">PROFILE SETTINGS</span>
          <h2>Edit Profile and Resume</h2>
          <p>
            Re-upload your resume, update your details, and keep your job
            matches accurate.
          </p>
        </div>
        <div className="profile-settings-score">
          <span>Profile completion</span>
          <strong>{profileCompletion}%</strong>
        </div>
      </header>

      {/* Profile Assessment Feedback */}
      <article className="panel profile-assessment">
        <h3>📊 Profile Assessment</h3>
        <ul className="assessment-feedback">
          {profileAssessment.feedback.map((item, idx) => (
            <li
              key={idx}
              className={item.startsWith("✓") ? "complete" : "pending"}
            >
              {item}
            </li>
          ))}
        </ul>
        {profileAssessment.priority.length > 0 && (
          <div className="priority-actions">
            <h4>Priority to improve:</h4>
            <p>{profileAssessment.priority.slice(0, 3).join(", ")}</p>
          </div>
        )}
      </article>

      <form className="grid-form onboarding-grid" onSubmit={onSubmit}>
        <article className="panel onboarding-card">
          <h3>Resume Update</h3>
          <label>
            Upload a new resume (PDF)
            <input type="file" accept=".pdf" onChange={onResumeUpload} />
          </label>

          {resumeLoading && (
            <p className="resume-status loading">Parsing new resume...</p>
          )}
          {resumeError && (
            <p className="resume-status error">Error: {resumeError}</p>
          )}
          {saveMessage && !resumeError && (
            <p className="resume-status loading">{saveMessage}</p>
          )}

          <label>
            Resume text (editable)
            <textarea
              rows={10}
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste or edit your resume content here."
              required
            />
          </label>
        </article>

        <article className="panel onboarding-card">
          <h3>Profile Details</h3>

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

          {/* Skill Categories Display */}
          {Object.entries(skillCategories).some(
            ([, cats]) => cats.length > 0,
          ) && (
            <div className="skill-categories">
              {skillCategories.technical.length > 0 && (
                <div className="skill-group">
                  <strong>🔧 Technical:</strong>
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
                <div className="skill-group">
                  <strong>⚙️ Frameworks:</strong>
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
                <div className="skill-group">
                  <strong>🛠️ Tools:</strong>
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
                <div className="skill-group">
                  <strong>💬 Soft Skills:</strong>
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
          )}

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
            Experience
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
            Save Profile Settings
          </button>
        </article>
      </form>
    </section>
  );
}
