interface ParsedResumeData {
  education: string
  inferredSkills: string[]
  projects: string
  achievements: string
  experience: string
  certifications: string
  resumeText: string
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export async function parseResumePDF(file: File): Promise<ParsedResumeData> {
  try {
    const formData = new FormData()
    formData.append('resume', file)

    const response = await fetch(`${BACKEND_URL}/api/parse-resume`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = 'Failed to parse resume'

      try {
        const error = await response.json()
        errorMessage = error.details
          ? `${error.error || 'Failed to parse resume'} (${error.details})`
          : error.error || errorMessage
      } catch {
        // Keep fallback message if response is not JSON.
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()

    return {
      education: result.data.education || '',
      inferredSkills: result.data.skills || [],
      projects: result.data.projects || '',
      achievements: result.data.achievements || '',
      experience: result.data.experience || '',
      certifications: result.data.certifications || '',
      resumeText: result.data.resumeText || '',
    }
  } catch (error) {
    console.error('Resume parsing error:', error)
    throw error
  }
}

const knownSkills = [
  'react',
  'typescript',
  'javascript',
  'python',
  'sql',
  'html',
  'css',
  'node',
  'communication',
  'statistics',
  'testing',
  'excel',
  'research',
  'roadmapping',
]

export function parseResumeText(text: string): ParsedResumeData {
  const lower = text.toLowerCase()

  const inferredSkills = knownSkills.filter((skill) => lower.includes(skill))

  return {
    education: '',
    inferredSkills,
    projects: '',
    achievements: '',
    experience: '',
    certifications: '',
    resumeText: text,
  }
}

export function readResumeFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read the selected resume file.'))
    reader.readAsText(file)
  })
}
