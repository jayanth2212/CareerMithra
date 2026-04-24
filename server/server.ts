import express from 'express'
import multer from 'multer'
import { spawnSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

interface LiveJobSourceItem {
  id: string | number
  name: string
  contents: string
  publication_date: string
  locations?: Array<{ name?: string }>
  company?: { name?: string }
  type?: string
  tags?: Array<string | { name?: string; short_name?: string }>
}

interface LiveJobsResponse {
  results?: LiveJobSourceItem[]
}

interface RapidApiJobItem {
  job_id?: string
  job_title?: string
  employer_name?: string
  job_publisher?: string
  job_city?: string
  job_state?: string
  job_country?: string
  job_location?: string
  job_employment_type?: string
  job_description?: string
  job_salary_string?: string
  job_min_salary?: number
  job_max_salary?: number
  job_salary_period?: string
  job_posted_at_datetime_utc?: string
  job_apply_link?: string
  job_required_skills?: string[]
}

interface RapidApiJobsResponse {
  data?: RapidApiJobItem[]
}

interface JobListing {
  id: string
  title: string
  company: string
  location: string
  type: 'Job' | 'Internship' | 'Opportunity'
  requiredSkills: string[]
  description: string
  deadline: string
  applyUrl?: string
  source?: string
  postedAt?: string
  publisher?: string
  salary?: string
}

type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Selected'

interface DbUser {
  id: string
  fullName: string
  email: string
  passwordHash: string
  createdAt: string
  onboardingComplete: boolean
  profile: OnboardingProfileDb | null
}

interface OnboardingProfileDb {
  education: string
  skills: string[]
  projects: string
  achievements: string
  experience: string
  certifications: string
  assessmentEnabled: boolean
  aptitudeScore?: number
  personalityType?: string
  resumeText: string
}

interface DbApplication {
  id: string
  userId: string
  opportunityId: string
  title: string
  company: string
  appliedDate: string
  deadline: string
  status: ApplicationStatus
  followUpReminder: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
}

interface DbShape {
  users: DbUser[]
  applications: DbApplication[]
}

interface AuthedRequest extends express.Request {
  userId?: string
}

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.resolve(__dirname, '../data/db.json')
const NODE_ENV = process.env.NODE_ENV || 'development'

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const TOKEN_SECRET = getRequiredEnv('TOKEN_SECRET')
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY?.trim() || ''
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
const RAPIDAPI_URL = process.env.RAPIDAPI_URL || 'https://jsearch.p.rapidapi.com/search'

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0)

if (NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must be set in production (comma-separated origins)')
}

const corsOriginAllowList =
  allowedOrigins.length > 0
    ? allowedOrigins
    : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000']

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function createMailerTransport() {
  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass || !Number.isFinite(port)) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

function resolvePythonScriptPath(): string {
  const candidates = [
    path.resolve(__dirname, 'pdf_parser.py'),
    path.resolve(__dirname, '../pdf_parser.py'),
    path.resolve(process.cwd(), 'pdf_parser.py'),
    path.resolve(process.cwd(), 'server/pdf_parser.py'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(`pdf_parser.py not found. Tried: ${candidates.join(', ')}`)
}

const pythonScript = resolvePythonScriptPath()

function ensureDb() {
  const dbDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  if (!fs.existsSync(DB_PATH)) {
    const initial: DbShape = { users: [], applications: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8')
  }
}

function readDb(): DbShape {
  ensureDb()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw) as DbShape
  } catch {
    return { users: [], applications: [] }
  }
}

function writeDb(db: DbShape) {
  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(':')
  if (!salt || !storedHash) return false
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'))
}

function createToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function verifyToken(token: string): { userId: string; exp: number } | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url')
  if (expected !== signature) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      userId: string
      exp: number
    }

    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = auth.replace('Bearer ', '').trim()
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.userId = payload.userId
  next()
}

function runResumeParser(filePath: string): string {
  const preferred = process.env.PYTHON_EXECUTABLE
  const candidates: Array<{ cmd: string; args: string[] }> = [
    ...(preferred ? [{ cmd: preferred, args: [pythonScript, filePath] }] : []),
    { cmd: 'python', args: [pythonScript, filePath] },
    { cmd: 'py', args: ['-3', pythonScript, filePath] },
  ]

  let lastError = 'Python parser execution failed'

  for (const candidate of candidates) {
    const result = spawnSync(candidate.cmd, candidate.args, { encoding: 'utf8' })
    const stdout = result.stdout?.toString().trim() || ''
    const stderr = result.stderr?.toString().trim() || ''

    if (result.status === 0 && stdout) {
      return stdout
    }

    lastError = stderr || result.error?.message || `${candidate.cmd} exited with status ${result.status}`
  }

  throw new Error(lastError)
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractSkillsFromText(text: string): string[] {
  const skillKeywords = [
    'React',
    'TypeScript',
    'JavaScript',
    'Python',
    'Node.js',
    'SQL',
    'HTML',
    'CSS',
    'AWS',
    'Docker',
    'Kubernetes',
    'MongoDB',
    'PostgreSQL',
    'Vue',
    'Angular',
    'Spring',
    'Java',
    'C++',
    'Go',
    'REST API',
    'GraphQL',
    'Git',
    'Linux',
    'Agile',
    'Scrum',
  ]

  const found = new Set<string>()
  const lowerText = text.toLowerCase()

  for (const skill of skillKeywords) {
    if (lowerText.includes(skill.toLowerCase())) {
      found.add(skill)
    }
  }

  return Array.from(found)
}

function detectJobType(title: string, jobType?: string): 'Job' | 'Internship' | 'Opportunity' {
  const lower = `${title} ${jobType || ''}`.toLowerCase()
  if (lower.includes('intern')) {
    return 'Internship'
  }
  if (lower.includes('junior') || lower.includes('entry')) {
    return 'Job'
  }
  return 'Opportunity'
}

function isIndiaLocation(location?: string): boolean {
  return Boolean(location && location.toLowerCase().includes('india'))
}

function normalizeSkillsFromTags(
  tags?: Array<string | { name?: string; short_name?: string }>,
): string[] {
  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }

  return tags
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag.trim()
      }

      return (tag.name || tag.short_name || '').trim()
    })
    .filter((value) => value.length > 0)
    .slice(0, 4)
}

function transformMuseJob(job: LiveJobSourceItem, index: number): JobListing {
  const description = stripHtml(job.contents || 'Join our team')
  const skillsFromTags = normalizeSkillsFromTags(job.tags)
  const skills =
    skillsFromTags.length > 0 ? skillsFromTags : extractSkillsFromText(description).slice(0, 4)
  const postedDate = new Date(job.publication_date || Date.now())
  const deadline = new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  const indiaLocation = job.locations?.find((location) => isIndiaLocation(location.name))?.name
  const fallbackLocation = job.locations?.[0]?.name || 'India'

  return {
    id: `job-${job.id || index}`,
    title: job.name || 'Position',
    company: job.company?.name || 'Company',
    location: indiaLocation || fallbackLocation,
    type: detectJobType(job.name || 'Opportunity', job.type),
    requiredSkills: skills,
    description,
    deadline: deadline.toISOString().slice(0, 10),
    source: 'The Muse',
    postedAt: postedDate.toISOString().slice(0, 10),
    publisher: 'The Muse',
  }
}

function transformRapidApiJob(job: RapidApiJobItem, index: number): JobListing {
  const title = (job.job_title || 'Position').trim()
  const description = stripHtml(job.job_description || `Opportunity for ${title}`)
  const postedDate = new Date(job.job_posted_at_datetime_utc || Date.now())
  const deadline = new Date(postedDate.getTime() + 21 * 24 * 60 * 60 * 1000)
  const locationParts = [job.job_location, job.job_city, job.job_state, job.job_country]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0)

  const skillsFromPayload = Array.isArray(job.job_required_skills)
    ? job.job_required_skills.map((skill) => skill.trim()).filter((skill) => skill.length > 0)
    : []

  const skillsFromText = extractSkillsFromText(`${title} ${description}`)
  const requiredSkills = [...new Set([...skillsFromPayload, ...skillsFromText])].slice(0, 5)

  const salaryParts = [
    typeof job.job_min_salary === 'number' ? `Min ${job.job_min_salary}` : '',
    typeof job.job_max_salary === 'number' ? `Max ${job.job_max_salary}` : '',
    job.job_salary_period || '',
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  const normalizedSalary =
    (job.job_salary_string || '').trim() || (salaryParts.length > 0 ? salaryParts.join(' · ') : '')

  return {
    id: `rapid-${job.job_id || index}`,
    title,
    company: (job.employer_name || 'Company').trim(),
    location: locationParts.length > 0 ? locationParts.join(', ') : 'India',
    type: detectJobType(title, job.job_employment_type),
    requiredSkills,
    description,
    deadline: deadline.toISOString().slice(0, 10),
    applyUrl: (job.job_apply_link || '').trim() || undefined,
    source: 'RapidAPI Jobs',
    postedAt: postedDate.toISOString().slice(0, 10),
    publisher: (job.job_publisher || '').trim() || undefined,
    salary: normalizedSalary || undefined,
  }
}

function shuffleJobs(items: JobListing[]): JobListing[] {
  const clone = [...items]
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]]
  }

  return clone
}

async function fetchIndiaJobsFromRapidApi(refreshKey = Date.now()): Promise<JobListing[]> {
  if (!RAPIDAPI_KEY) {
    return []
  }

  const queries = [
    'software developer',
    'data analyst',
    'frontend developer internship',
  ]
  const collected: JobListing[] = []

  for (let index = 0; index < queries.length; index += 1) {
    const query = queries[index]
    const page = ((Math.floor(refreshKey / 1000) + index) % 3) + 1
    const params = new URLSearchParams({
      query,
      page: String(page),
      num_pages: '1',
      country: 'in',
      date_posted: 'all',
    })

    const response = await fetch(`${RAPIDAPI_URL}?${params.toString()}`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    })

    if (!response.ok) {
      continue
    }

    const payload = (await response.json()) as RapidApiJobsResponse
    const jobs = (payload.data || [])
      .filter((job) =>
        isIndiaLocation(
          job.job_location || job.job_country || job.job_state || job.job_city || 'India',
        ),
      )
      .map((job, index) => transformRapidApiJob(job, index))

    collected.push(...jobs)

    if (collected.length >= 30) {
      break
    }
  }

  const deduped = new Map<string, JobListing>()
  for (const job of collected) {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}-${job.location.toLowerCase()}`
    if (!deduped.has(key)) {
      deduped.set(key, job)
    }
  }

  const varied = shuffleJobs(Array.from(deduped.values()))
  return varied.slice(0, 24)
}

async function fetchIndiaJobsFromMuse(): Promise<JobListing[]> {
  const pagesToScan = 10
  const collected: JobListing[] = []

  for (let page = 1; page <= pagesToScan; page += 1) {
    const response = await fetch(
      `https://www.themuse.com/api/public/jobs?page=${page}&category=Software%20Engineering`,
    )

    if (!response.ok) {
      continue
    }

    const data = (await response.json()) as LiveJobsResponse
    const jobs = (data.results || [])
      .filter((job) => job.locations?.some((location) => isIndiaLocation(location.name)))
      .map((job, index) => transformMuseJob(job, index))

    collected.push(...jobs)

    if (collected.length >= 20) {
      break
    }
  }

  return collected.slice(0, 20)
}

async function fetchRealIndiaJobs(refreshKey = Date.now()): Promise<JobListing[]> {
  const rapidApiJobs = await fetchIndiaJobsFromRapidApi(refreshKey)
  if (rapidApiJobs.length > 0) {
    return rapidApiJobs
  }

  return shuffleJobs(await fetchIndiaJobsFromMuse())
}

function getFallbackJobs(): JobListing[] {
  return [
    {
      id: 'op-1',
      title: 'Senior Frontend Engineer (React)',
      company: 'Vercel',
      location: 'India',
      type: 'Job',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'CSS'],
      description:
        'Build high-performance web experiences. We are looking for experienced React developers to join our platform team.',
      deadline: '2026-06-15',
      source: 'CareerMithra fallback',
      postedAt: '2026-04-12',
      publisher: 'CareerMithra',
      salary: '6-10 LPA',
    },
    {
      id: 'op-2',
      title: 'Full Stack Engineer',
      company: 'Stripe',
      location: 'India',
      type: 'Job',
      requiredSkills: ['JavaScript', 'Python', 'SQL', 'AWS'],
      description:
        'Work on payment infrastructure. Help build the tools that power internet commerce.',
      deadline: '2026-06-10',
      source: 'CareerMithra fallback',
      postedAt: '2026-04-10',
      publisher: 'CareerMithra',
      salary: '8-12 LPA',
    },
    {
      id: 'op-3',
      title: 'Data Analyst Intern',
      company: 'Google',
      location: 'India',
      type: 'Internship',
      requiredSkills: ['Python', 'SQL', 'Statistics', 'Excel'],
      description:
        'Analyze data to drive product decisions. Work with internal analytics tools and dashboards.',
      deadline: '2026-05-30',
      source: 'CareerMithra fallback',
      postedAt: '2026-04-11',
      publisher: 'CareerMithra',
      salary: '3-5 LPA',
    },
  ]
}

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOriginAllowList.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
  }),
)
app.use(express.json())

ensureDb()

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password } = req.body as {
    fullName?: string
    email?: string
    password?: string
  }

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'fullName, email, and password are required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address' })
  }

  const db = readDb()
  const existing = db.users.find((user) => user.email === normalizedEmail)
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const user: DbUser = {
    id: crypto.randomUUID(),
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    onboardingComplete: false,
    profile: null,
  }

  db.users.push(user)
  writeDb(db)

  const token = createToken(user.id)
  res.status(201).json({
    token,
    user: {
      fullName: user.fullName,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      profile: user.profile,
    },
  })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address' })
  }

  const db = readDb()
  const user = db.users.find((item) => item.email === normalizedEmail)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = createToken(user.id)
  res.json({
    token,
    user: {
      fullName: user.fullName,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      profile: user.profile,
    },
  })
})

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  const db = readDb()
  const user = db.users.find((item) => item.id === req.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({
    user: {
      fullName: user.fullName,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      profile: user.profile,
    },
  })
})

app.get('/api/profile', requireAuth, (req: AuthedRequest, res) => {
  const db = readDb()
  const user = db.users.find((item) => item.id === req.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({
    onboardingComplete: user.onboardingComplete,
    profile: user.profile,
  })
})

app.put('/api/profile', requireAuth, (req: AuthedRequest, res) => {
  const profile = req.body as OnboardingProfileDb

  if (!profile || !profile.resumeText) {
    return res.status(400).json({ error: 'Invalid profile payload' })
  }

  const db = readDb()
  const idx = db.users.findIndex((item) => item.id === req.userId)
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  db.users[idx] = {
    ...db.users[idx],
    onboardingComplete: true,
    profile,
  }

  writeDb(db)

  res.json({
    onboardingComplete: true,
    profile,
  })
})

// Jobs and My Jobs endpoints
app.get('/api/jobs', async (req, res) => {
  try {
    const refreshKeyParam = String(req.query.refreshKey || '')
    const refreshKey = Number.parseInt(refreshKeyParam, 10)
    const jobs = await fetchRealIndiaJobs(Number.isFinite(refreshKey) ? refreshKey : Date.now())

    res.json(jobs.length > 0 ? jobs : getFallbackJobs())
  } catch {
    res.json(getFallbackJobs())
  }
})

app.get('/api/applications', requireAuth, (req: AuthedRequest, res) => {
  const db = readDb()
  const records = db.applications
    .filter((item) => item.userId === req.userId)
    .sort((a, b) => (a.appliedDate < b.appliedDate ? 1 : -1))

  res.json({ applications: records })
})

app.post('/api/applications', requireAuth, (req: AuthedRequest, res) => {
  const payload = req.body as Omit<DbApplication, 'id' | 'userId'>

  if (!payload?.opportunityId || !payload?.title || !payload?.company) {
    return res.status(400).json({ error: 'Invalid application payload' })
  }

  const db = readDb()
  const exists = db.applications.find(
    (item) => item.userId === req.userId && item.opportunityId === payload.opportunityId,
  )

  if (exists) {
    return res.status(409).json({ error: 'Application already exists for this job' })
  }

  const record: DbApplication = {
    id: `app-${Date.now()}`,
    userId: req.userId!,
    opportunityId: payload.opportunityId,
    title: payload.title,
    company: payload.company,
    appliedDate: payload.appliedDate,
    deadline: payload.deadline,
    status: payload.status,
    followUpReminder: payload.followUpReminder,
    matchScore: payload.matchScore,
    matchedSkills: payload.matchedSkills || [],
    missingSkills: payload.missingSkills || [],
  }

  db.applications.push(record)
  writeDb(db)
  res.status(201).json({ application: record })
})

app.post('/api/notifications/application-email', async (req, res) => {
  const {
    toEmail,
    fullName,
    jobTitle,
    company,
    matchScore,
    matchedSkills,
    missingSkills,
  } = req.body as {
    toEmail?: string
    fullName?: string
    jobTitle?: string
    company?: string
    matchScore?: number
    matchedSkills?: string[]
    missingSkills?: string[]
  }

  if (!toEmail || !jobTitle || !company || !isValidEmail(toEmail)) {
    return res.status(400).json({ error: 'toEmail, jobTitle, and company are required' })
  }

  const transport = createMailerTransport()
  if (!transport) {
    return res.status(503).json({
      error:
        'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.',
    })
  }

  const safeMatchedSkills = Array.isArray(matchedSkills) ? matchedSkills.slice(0, 8) : []
  const safeMissingSkills = Array.isArray(missingSkills) ? missingSkills.slice(0, 8) : []
  const safeMatchScore = typeof matchScore === 'number' ? `${Math.round(matchScore)}%` : 'N/A'
  const userLabel = (fullName || 'there').trim()
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@careermithra.local'

  const text = [
    `Hi ${userLabel},`,
    '',
    `You applied for ${jobTitle} at ${company}.`,
    `Match Score: ${safeMatchScore}`,
    `Matched Skills: ${safeMatchedSkills.length > 0 ? safeMatchedSkills.join(', ') : 'None detected'}`,
    `Missing Skills: ${safeMissingSkills.length > 0 ? safeMissingSkills.join(', ') : 'No major gaps detected'}`,
    '',
    'Thanks for using CareerMithra.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
      <h2 style="margin:0 0 12px">Application Confirmation</h2>
      <p>Hi ${userLabel},</p>
      <p>You applied for <strong>${jobTitle}</strong> at <strong>${company}</strong>.</p>
      <p><strong>Match Score:</strong> ${safeMatchScore}</p>
      <p><strong>Matched Skills:</strong> ${safeMatchedSkills.length > 0 ? safeMatchedSkills.join(', ') : 'None detected'}</p>
      <p><strong>Missing Skills:</strong> ${safeMissingSkills.length > 0 ? safeMissingSkills.join(', ') : 'No major gaps detected'}</p>
      <p>Thanks for using CareerMithra.</p>
    </div>
  `

  try {
    await transport.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Application Update: ${jobTitle} at ${company}`,
      text,
      html,
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to send application email:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send email',
    })
  }
})

app.patch('/api/applications/:id/status', requireAuth, (req: AuthedRequest, res) => {
  const { id } = req.params
  const { status } = req.body as { status?: ApplicationStatus }

  if (!status) {
    return res.status(400).json({ error: 'status is required' })
  }

  const db = readDb()
  const idx = db.applications.findIndex(
    (item) => item.id === id && item.userId === req.userId,
  )

  if (idx === -1) {
    return res.status(404).json({ error: 'Application not found' })
  }

  db.applications[idx] = {
    ...db.applications[idx],
    status,
  }
  writeDb(db)

  res.json({ application: db.applications[idx] })
})

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    void req
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Resume parser service running' })
})

// Resume parsing endpoint
app.post('/api/parse-resume', upload.single('resume'), (req, res) => {
  const uploadedPath = req.file?.path

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const filePath = path.resolve(req.file.path)
    const result = runResumeParser(filePath)

    const parsedData = JSON.parse(result)

    if (parsedData.success === false) {
      return res.status(400).json({ error: parsedData.error })
    }

    res.json({
      success: true,
      data: {
        education: parsedData.education || '',
        skills: parsedData.skills || [],
        projects: parsedData.projects || '',
        achievements: parsedData.achievements || '',
        experience: parsedData.experience || '',
        certifications: parsedData.certifications || '',
        resumeText: parsedData.rawText || '',
      },
    })
  } catch (error) {
    console.error('Resume parsing error:', error)

    res.status(500).json({
      error: 'Failed to parse resume. Ensure Python and PyMuPDF are installed.',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  } finally {
    if (uploadedPath) {
      fs.unlink(uploadedPath, (err) => {
        if (err) console.warn('Failed to delete temp file:', err)
      })
    }
  }
})

// Error handling middleware
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void req
  void next
  console.error('Server error:', err)
  res.status(500).json({
    error: err instanceof Error ? err.message : 'Internal server error',
  })
})

app.listen(PORT, () => {
  console.log(`Resume parser service running on http://localhost:${PORT}`)
})
