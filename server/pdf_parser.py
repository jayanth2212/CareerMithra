import sys
import json
import fitz
from pathlib import Path
import re

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF (fitz)."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def normalize_lines(text: str):
    return [line.strip() for line in text.splitlines()]

def extract_section(raw_text: str, headers: list[str]) -> str:
    lines = normalize_lines(raw_text)
    if not lines:
        return ""

    header_patterns = [h.lower() for h in headers]
    all_section_markers = [
        'education', 'skills', 'technical skills', 'projects', 'achievements',
        'experience', 'work experience', 'certifications', 'certification',
        'summary', 'objective', 'profile', 'interests'
    ]

    start_idx = -1
    for idx, line in enumerate(lines):
      lower = line.lower().rstrip(':')
      if any(lower == marker or lower.startswith(f"{marker}:") for marker in header_patterns):
          start_idx = idx + 1
          break

    if start_idx == -1:
        return ""

    collected = []
    for idx in range(start_idx, len(lines)):
        line = lines[idx].strip()
        if not line:
            if collected:
                break
            continue

        lower = line.lower().rstrip(':')
        if any(lower == marker or lower.startswith(f"{marker}:") for marker in all_section_markers):
            break
        collected.append(line)

    return "\n".join(collected).strip()

def extract_skills(raw_text: str, skills_section: str) -> list[str]:
    known_skills = [
        'react', 'typescript', 'javascript', 'python', 'sql', 'html', 'css',
        'node', 'java', 'c++', 'go', 'rust', 'communication', 'statistics',
        'testing', 'excel', 'research', 'roadmapping', 'aws', 'docker',
        'kubernetes', 'spring', 'mongodb', 'postgresql', 'git', 'agile',
        'scrum', 'rest api', 'graphql', 'linux', 'vue', 'angular',
        'machine learning', 'tensorflow', 'pytorch', 'keras', 'nltk',
        'devops', 'ci/cd', 'jenkins', 'redis', 'microservices'
    ]

    source = f"{skills_section}\n{raw_text}".lower()
    extracted = []
    for skill in known_skills:
        if skill in source:
            extracted.append(skill.title())

    return list(dict.fromkeys(extracted))

def extract_resume_data(pdf_path: str) -> dict:
    """Extract resume data from PDF file."""
    try:
        # Extract text from PDF
        text = extract_text_from_pdf(pdf_path)
        
        education = extract_section(text, ['education'])
        skills_section = extract_section(text, ['skills', 'technical skills'])
        projects = extract_section(text, ['projects'])
        achievements = extract_section(text, ['achievements'])
        experience = extract_section(text, ['experience', 'work experience'])
        certifications = extract_section(text, ['certifications', 'certification'])

        extracted_skills = extract_skills(text, skills_section)

        if not education:
            edu_match = re.search(r'(b\.tech|bachelor|master|ph\.?d|university|college)[^\n]*', text, re.IGNORECASE)
            if edu_match:
                education = edu_match.group(0).strip()

        if not experience:
            exp_match = re.search(r'(\d+\+?\s+years?\s+of\s+experience[^\n]*)', text, re.IGNORECASE)
            if exp_match:
                experience = exp_match.group(0).strip()
        
        return {
            "success": True,
            "education": education,
            "skills": extracted_skills,
            "projects": projects,
            "achievements": achievements,
            "experience": experience,
            "certifications": certifications,
            "rawText": text[:5000]  # First 5000 chars for resumeText field
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = extract_resume_data(pdf_path)
    print(json.dumps(result))
