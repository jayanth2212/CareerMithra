import { useEffect, useMemo, useRef, useState } from "react";
import { useCareerMithra } from "../context/useCareerMithra";
import {
  APPLY_THRESHOLD,
  calculateMatchScore,
} from "../services/matchingService";

function normalizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return skill.trim();
      }

      if (skill && typeof skill === "object") {
        const value = skill as { name?: unknown; short_name?: unknown };
        if (typeof value.name === "string") return value.name.trim();
        if (typeof value.short_name === "string")
          return value.short_name.trim();
      }

      return "";
    })
    .filter((skill) => skill.length > 0);
}

function companyMonogram(company: string): string {
  const parts = company
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return "JB";
  }

  return parts.map((part) => part[0].toUpperCase()).join("");
}

function formatDeadlineLabel(deadline: string): string {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatDateLabel(value?: string): string {
  if (!value) {
    return "Recently posted";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatTimeLabel(value: Date): string {
  return value.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

type DescriptionSection = {
  title: string;
  paragraphs: string[];
};

const DESCRIPTION_SECTION_TITLES: Array<{ match: string; title: string }> = [
  { match: "responsibilities", title: "Responsibilities" },
  { match: "requirements", title: "Requirements" },
  { match: "qualifications", title: "Qualifications" },
  { match: "skills", title: "Skills" },
  { match: "benefits", title: "Benefits" },
  { match: "about the role", title: "About The Role" },
  { match: "about us", title: "About The Company" },
  { match: "about company", title: "About The Company" },
  { match: "summary", title: "Overview" },
  { match: "overview", title: "Overview" },
];

function toDescriptionParagraphs(description: string): string[] {
  const raw = description.trim();
  if (!raw) {
    return ["Description is currently unavailable for this role."];
  }

  const newlineParagraphs = raw
    .split(/\n+/)
    .map((line) => line.replace(/^[•\-*]\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (newlineParagraphs.length >= 2) {
    return newlineParagraphs;
  }

  const normalized = raw.replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  if (sentences.length <= 2) {
    return [normalized];
  }

  const chunkSize = 2;
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += chunkSize) {
    paragraphs.push(sentences.slice(index, index + chunkSize).join(" "));
  }

  return paragraphs;
}

function detectSectionTitle(paragraph: string): string | null {
  const normalized = paragraph
    .toLowerCase()
    .replace(/^[•\-*\d.)\s]+/, "")
    .trim();

  for (const item of DESCRIPTION_SECTION_TITLES) {
    if (
      normalized === item.match ||
      normalized.startsWith(`${item.match}:`) ||
      normalized.startsWith(`${item.match} -`) ||
      normalized.startsWith(`${item.match} —`)
    ) {
      return item.title;
    }
  }

  return null;
}

function stripSectionPrefix(paragraph: string, sectionTitle: string): string {
  const loweredTitle = sectionTitle.toLowerCase();
  const heading = DESCRIPTION_SECTION_TITLES.find(
    (item) => item.title.toLowerCase() === loweredTitle,
  );

  if (!heading) {
    return paragraph.trim();
  }

  const escapedMatch = heading.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return paragraph
    .replace(
      new RegExp(`^[•\\-*\\d.)\\s]*${escapedMatch}\\s*[:\u2014-]?\\s*`, "i"),
      "",
    )
    .trim();
}

function toDescriptionSections(description: string): DescriptionSection[] {
  const paragraphs = toDescriptionParagraphs(description);
  if (paragraphs.length === 0) {
    return [{ title: "Overview", paragraphs: [description] }];
  }

  const sections: DescriptionSection[] = [];
  let currentSection: DescriptionSection = {
    title: "Overview",
    paragraphs: [],
  };

  for (const paragraph of paragraphs) {
    const detectedTitle = detectSectionTitle(paragraph);
    if (detectedTitle) {
      if (currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }

      const content = stripSectionPrefix(paragraph, detectedTitle);
      currentSection = {
        title: detectedTitle,
        paragraphs: content ? [content] : [],
      };
      continue;
    }

    currentSection.paragraphs.push(paragraph);
  }

  if (currentSection.paragraphs.length > 0) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ title: "Overview", paragraphs }];
}

export function JobDiscoveryPage() {
  const {
    state,
    applyToOpportunity,
    markOpportunityAsApplied,
    refreshJobs,
    jobsLoading,
  } = useCareerMithra();
  const [searchFilter, setSearchFilter] = useState("");
  const [activeOpportunityId, setActiveOpportunityId] = useState<string | null>(
    null,
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const previousLoadingRef = useRef(jobsLoading);

  const scoredJobs = useMemo(() => {
    const appliedOpportunityIds = new Set(
      state.applications.map((application) => application.opportunityId),
    );

    return state.opportunities
      .filter((opportunity) => !appliedOpportunityIds.has(opportunity.id))
        .map((opportunity) => ({
          opportunity,
          match: calculateMatchScore(state.profile, opportunity),
          requiredSkills: normalizeSkills(opportunity.requiredSkills),
        }))
        .sort((left, right) => right.match.score - left.match.score);
  }, [state.opportunities, state.profile, state.applications]);

  const filtered = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    if (!query) {
      return scoredJobs;
    }

    return scoredJobs.filter(({ opportunity }) => {
      const normalizedSkills = normalizeSkills(opportunity.requiredSkills);

      return (
        opportunity.title.toLowerCase().includes(query) ||
        opportunity.company.toLowerCase().includes(query) ||
        opportunity.location.toLowerCase().includes(query) ||
        opportunity.type.toLowerCase().includes(query) ||
        normalizedSkills.some((skill) => skill.toLowerCase().includes(query))
      );
    });
  }, [scoredJobs, searchFilter]);

  const strongMatches = scoredJobs.filter(
    ({ match }) => match.score >= APPLY_THRESHOLD,
  ).length;
  const readyToApply = scoredJobs.filter(
    ({ match }) => match.score >= APPLY_THRESHOLD,
  ).length;

  const effectiveActiveOpportunityId = useMemo(() => {
    if (filtered.length === 0) {
      return null;
    }

    const stillExists = filtered.some(
      ({ opportunity }) => opportunity.id === activeOpportunityId,
    );

    return stillExists ? activeOpportunityId : filtered[0].opportunity.id;
  }, [filtered, activeOpportunityId]);

  useEffect(() => {
    if (previousLoadingRef.current && !jobsLoading) {
      setLastRefreshedAt(new Date());
    }

    previousLoadingRef.current = jobsLoading;
  }, [jobsLoading]);

  const activeListing =
    filtered.find(
      ({ opportunity }) => opportunity.id === effectiveActiveOpportunityId,
    ) ||
    filtered[0] ||
    null;

  return (
    <section className="dashboard-page jobs-board-page">
      <header className="panel jobs-board-head">
        <div className="jobs-board-title-row">
          <div>
            <h2>Live Jobs</h2>
            <p>
              Real-time openings for India from verified job sources, ranked to
              your profile by AI.
            </p>
          </div>
          <div className="jobs-board-title-actions">
            <span className="jobs-board-refresh-meta">
              Last refreshed: {formatTimeLabel(lastRefreshedAt)}
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={refreshJobs}
              disabled={jobsLoading}
            >
              {jobsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="jobs-board-search-row">
          <input
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            placeholder='e.g. "data science intern in Bangalore"'
            type="search"
          />
          <button type="button" className="primary-button" disabled>
            Search
          </button>
        </div>

        <div className="jobs-board-stats">
          <span>{state.opportunities.length} total jobs</span>
          <span>{strongMatches} strong matches</span>
          <span>{readyToApply} ready to apply</span>
          <span>{state.applications.length} already applied</span>
        </div>
      </header>

      <div className="jobs-board-two-pane">
        {state.opportunities.length === 0 && (
          <article className="panel">
            <p>Loading real job opportunities from job boards...</p>
          </article>
        )}

        {state.opportunities.length > 0 && filtered.length === 0 && (
          <article className="panel">
            <p>No jobs match your filters. Try adjusting your search.</p>
          </article>
        )}

        {filtered.length > 0 && (
          <>
            <div className="panel jobs-board-list-column">
              <div className="jobs-board-list-head">
                <h3>Results</h3>
                <span>{filtered.length} roles</span>
              </div>

              <div className="jobs-board-list-scroller">
                {filtered.map(({ opportunity, match }) => {
                  const isActive =
                    opportunity.id === activeListing?.opportunity.id;
                  return (
                    <button
                      key={opportunity.id}
                      type="button"
                      className={`jobs-list-item ${isActive ? "active" : ""}`}
                      onClick={() => setActiveOpportunityId(opportunity.id)}
                    >
                      <div className="jobs-list-item-head">
                        <span className="jobs-list-company-mark">
                          {companyMonogram(opportunity.company)}
                        </span>
                        <div>
                          <h4>{opportunity.title}</h4>
                          <p>{opportunity.company}</p>
                        </div>
                      </div>

                      <div className="jobs-list-item-meta">
                        <span>{opportunity.location}</span>
                        <span>{opportunity.type}</span>
                        <span>
                          Posted {formatDateLabel(opportunity.postedAt)}
                        </span>
                        {opportunity.publisher ? (
                          <span>Via {opportunity.publisher}</span>
                        ) : null}
                        {opportunity.salary ? (
                          <span>{opportunity.salary}</span>
                        ) : null}
                      </div>

                      <div className="jobs-list-item-foot">
                        <strong>{match.score}% match</strong>
                        <span>Open role</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeListing && (
              <article className="panel jobs-board-card jobs-board-detail-column">
                {(() => {
                  const { opportunity, match } = activeListing;
                  const alreadyApplied = state.applications.some(
                    (application) =>
                      application.opportunityId === opportunity.id,
                  );
                  const canRedirectToApply = Boolean(opportunity.applyUrl);
                  const canTrackApply =
                    match.score >= APPLY_THRESHOLD && !alreadyApplied;
                  const whyYouMatch =
                    match.matchReasons.length > 0
                      ? match.matchReasons
                      : [
                          `Your profile aligns with ${match.matchedSkills.slice(0, 3).join(", ") || opportunity.title}.`,
                        ];

                  const skillGaps =
                    match.gapReasons.length > 0
                      ? match.gapReasons
                      : ["No major skill gaps detected"];

                  return (
                    <>
                      <div className="jobs-board-card-head">
                        <div className="jobs-board-company-mark">
                          <span>{companyMonogram(opportunity.company)}</span>
                        </div>

                        <div className="jobs-board-main-copy">
                          <h3>{opportunity.company}</h3>
                          <p className="jobs-board-role">{opportunity.title}</p>
                          <div className="jobs-board-meta-row">
                            <span>{opportunity.location}</span>
                            <span>{opportunity.type}</span>
                            <span>
                              Posted {formatDateLabel(opportunity.postedAt)}
                            </span>
                            <span>
                              {formatDeadlineLabel(opportunity.deadline)}
                            </span>
                            {opportunity.source ? (
                              <span>{opportunity.source}</span>
                            ) : null}
                            {opportunity.publisher ? (
                              <span>Via {opportunity.publisher}</span>
                            ) : null}
                            {opportunity.salary ? (
                              <span>{opportunity.salary}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="jobs-board-apply-wrap">
                          {opportunity.applyUrl ? (
                            <a
                              className="ghost-button"
                              href={opportunity.applyUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open listing
                            </a>
                          ) : null}
                          <button
                            className="primary-button"
                            disabled={!canRedirectToApply}
                            onClick={() => {
                              if (!opportunity.applyUrl) {
                                return;
                              }

                              window.open(opportunity.applyUrl, "_blank", "noopener,noreferrer");
                              if (canTrackApply) {
                                void applyToOpportunity(opportunity.id);
                              }
                            }}
                            data-low-match={!canTrackApply}
                          >
                            {canRedirectToApply ? "Apply" : "Listing unavailable"}
                          </button>
                        </div>
                      </div>

                      <div className="jobs-board-apply-check-row">
                        <label className="jobs-board-apply-check">
                          <input
                            type="checkbox"
                            onChange={(event) => {
                              if (event.target.checked) {
                                void markOpportunityAsApplied(opportunity.id);
                              }
                            }}
                          />
                          <span>I have applied for this role</span>
                        </label>
                      </div>

                      <div className="jobs-board-score-row">
                        <span>Match Score</span>
                        <strong>{match.score}%</strong>
                      </div>

                      <div className="progress-track jobs-board-progress">
                        <div
                          className="progress-fill"
                          style={{ width: `${match.score}%` }}
                        />
                      </div>

                      <div className="jobs-board-description">
                        {toDescriptionSections(opportunity.description).map(
                          (section, sectionIndex) => (
                            <section
                              key={`${opportunity.id}-description-section-${sectionIndex}`}
                              className="jobs-description-section"
                            >
                              <h4>{section.title}</h4>
                              {section.paragraphs.map(
                                (paragraph, paragraphIndex) => (
                                  <p
                                    key={`${opportunity.id}-description-${sectionIndex}-${paragraphIndex}`}
                                  >
                                    {paragraph}
                                  </p>
                                ),
                              )}
                            </section>
                          ),
                        )}
                      </div>

                      <section className="jobs-board-skill-breakdown">
                        <h4>Skill Match Breakdown</h4>
                        <div className="jobs-board-skill-columns">
                          <div>
                            <h5>
                              Matching Skills ({match.matchedSkills.length})
                            </h5>
                            <div className="jobs-board-skill-tags good">
                              {match.matchedSkills.length > 0 ? (
                                match.matchedSkills.map((skill) => (
                                  <span
                                    key={`matched-${opportunity.id}-${skill}`}
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span>No direct match found yet</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h5>
                              Missing Skills ({match.missingSkills.length})
                            </h5>
                            <div className="jobs-board-skill-tags missing">
                              {match.missingSkills.length > 0 ? (
                                match.missingSkills.map((skill) => (
                                  <span
                                    key={`missing-${opportunity.id}-${skill}`}
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span>No major skill gaps detected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      <div className="jobs-board-insights-grid">
                        <section>
                          <h4>Why you match</h4>
                          <ul className="jobs-board-points good">
                            {whyYouMatch.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        </section>

                        <section>
                          <h4>Skill gaps</h4>
                          <div className="jobs-board-gap-tags">
                            {skillGaps.map((gap) => (
                              <span key={gap}>{gap}</span>
                            ))}
                          </div>
                        </section>
                      </div>
                    </>
                  );
                })()}
              </article>
            )}
          </>
        )}
      </div>
    </section>
  );
}
