/**
 * Single source of truth for everything written on the site.
 * Edit here → whole site updates.
 */

export const person = {
  name: 'Atharv Tiwari',
  firstName: 'Atharv',
  role: 'Full-Stack Developer × AI Engineer',
  tagline: 'I build AI systems that ship.',
  heroSub:
    '120+ APIs shipped across healthcare, fintech & civic tech. Currently CTO @ Nexera. Second-year CSE, Delhi.',
  location: 'New Delhi, India',
  timezone: 'Asia/Kolkata',
  email: 'tiwariatharv01042005@gmail.com',
  github: { label: 'GitHub', handle: 'Atharv-tw', url: 'https://github.com/Atharv-tw' },
  linkedin: { label: 'LinkedIn', handle: 'atharvtw', url: 'https://www.linkedin.com/in/atharvtw' },
  resumePdf: '/resume.pdf',
  about: [
    'Second-year CSE student at GGSIPU, Delhi — and CTO at Nexera, where I own technical and product decisions end to end.',
    'I have shipped production systems in healthcare, civic governance and fintech: zero-knowledge encryption, multi-agent AI platforms, and 120+ APIs that real users depend on.',
    'I lead teams, write about what I build, and turn hackathon weekends into working products.',
  ],
} as const

export type ProjectMotif = 'radar' | 'arcade' | 'orbit' | 'deck' | 'vault'

export interface Project {
  id: string
  index: string
  name: string
  /** compact label for tight spots like the tech matrix columns */
  short: string
  kind: string
  year: string
  accent: string
  motif: ProjectMotif
  kicker: string
  bullets: string[]
  impact: string
  tech: string[]
  /** TODO(Atharv): drop repo/live URLs here when ready — UI hides empty ones */
  links: { repo: string; live: string }
}

export const projects: Project[] = [
  {
    id: 'onyx',
    index: '01',
    name: 'Onyx',
    short: 'Onyx',
    kind: 'AI-powered DAST security platform',
    year: '2025',
    accent: '#ff4655',
    motif: 'radar',
    kicker: 'Finds vulnerabilities. Then ships the fix.',
    bullets: [
      'High-concurrency scanning engine integrating Subfinder, Nmap and Nuclei with custom logical probes for SQLi, SSRF and IDOR.',
      'AI triage layer (Claude / Llama) that reads raw scanner output and deduplicates findings with 90%+ accuracy.',
      'Automated remediation via GitHub App — opens verified security pull requests on the affected repo.',
    ],
    impact: '~70% reduction in Mean Time To Repair · showcased in hackathons, tested by judges',
    tech: ['Python', 'FastAPI', 'Nuclei', 'Nmap', 'Claude', 'GitHub API', 'Docker'],
    links: { repo: '', live: '' },
  },
  {
    id: 'finstar',
    index: '02',
    name: 'Finstar',
    short: 'Finstar',
    kind: 'Gamified finance education for teens',
    year: '2025',
    accent: '#ffb114',
    motif: 'arcade',
    kicker: 'Finance education Gen-Z teens actually finish.',
    bullets: [
      'Four interactive game modules — Life Swipe, Budget Hero, Market Explorer, Quiz Battle — with emotion-aware scoring wired into the learning path.',
      'Robust Firebase database backed by Supabase edge functions for data integrity and atomic operations.',
      'AI-backed market simulation that reacts like a real (chaotic) market.',
    ],
    impact: '100+ positive reviews from real users',
    tech: ['React', 'Firebase', 'Supabase', 'TypeScript', 'AI simulation'],
    links: { repo: '', live: '' },
  },
  {
    id: 'health-companion',
    index: '03',
    name: 'AI Health Companion',
    short: 'Health AI',
    kind: 'Context-aware multi-agent health platform',
    year: '2025',
    accent: '#2ee6a8',
    motif: 'orbit',
    kicker: 'Eight agents that explain your health — without playing doctor.',
    bullets: [
      'Safety-first platform that explains symptoms and medical reports without diagnosing — RAG over user history with strict guardrails.',
      'Deterministic risk detection surfacing early warning patterns across logs, vitals and lifestyle data.',
      'Medical-safe workflows: report analysis, multi-assistant routing, emergency escalation logic.',
    ],
    impact: '8 context-aware agents in one system — built overnight for a 36-hour live hackathon',
    tech: ['Python', 'RAG', 'Vector DBs', 'FastAPI', 'AI Agents'],
    links: { repo: '', live: '' },
  },
  {
    id: 'codeswipe',
    index: '04',
    name: 'Codeswipe',
    short: 'Codeswipe',
    kind: 'Swipe-based developer collaboration platform',
    year: '2025',
    accent: '#ff4d9d',
    motif: 'deck',
    kicker: 'Swipe right on your next collaborator.',
    bullets: [
      'Swipe-based, mobile-first frontend for matching developers to projects and people.',
      'Gesture-driven cards, physics-y animations and responsive layouts with Framer Motion + Tailwind.',
      'Reusable UI components and state-driven flows tuned for UX performance and clarity.',
    ],
    impact: '100+ pre-registrations before launch',
    tech: ['React', 'Framer Motion', 'Tailwind CSS', 'TypeScript'],
    links: { repo: '', live: '' },
  },
  {
    id: 'healthvault',
    index: '05',
    name: 'HealthVault',
    short: 'HealthVault',
    kind: 'Zero-knowledge encrypted health records',
    year: '2024',
    accent: '#00e5ff',
    motif: 'vault',
    kicker: 'Your records. Your keys. Nobody else.',
    bullets: [
      'Zero-knowledge health record system with AES-256-GCM client-side encryption — the server never sees plaintext.',
      '30+ APIs for secure medical data access, sharing, and instant revocation.',
      'QR-based access control plus AI summaries in patient-friendly and clinical flavors.',
    ],
    impact: '40% easier comprehension of medical reports via AI summaries',
    tech: ['Node.js', 'AES-256-GCM', 'Postgres', 'QR access', 'AI summaries'],
    links: { repo: '', live: '' },
  },
]

export interface Role {
  id: string
  company: string
  /** shown next to the company when there is a public site worth naming */
  site?: string
  title: string
  period: string
  location: string
  current?: boolean
  bullets: string[]
  tech: string[]
}

export const experience: Role[] = [
  {
    id: 'nexera',
    company: 'Nexera',
    site: 'nexeraofficial.in',
    title: 'Founding Chief Technical Officer',
    period: 'Nov 2025 — Present',
    location: 'Remote',
    current: true,
    bullets: [
      'Led technical development of a production platform serving 2K+ daily users — owning architecture, infrastructure and the key product calls.',
      'Engineered secure premium-content delivery with Redis-based concurrent-stream protection and access-control workflows.',
      'Built a centralized admin panel with role-based access control for premium content management.',
    ],
    tech: ['Redis', 'Node.js', 'Docker', 'RBAC', 'Job Queues'],
  },
  {
    id: 'foundu',
    company: 'FoundU',
    title: 'Full-Stack Intern',
    period: 'Jun 2026 — Aug 2026',
    location: 'Remote',
    bullets: [
      'Built the end-to-end founder onboarding experience across landing, authentication and profile completion, wiring frontend to backend workflows.',
      'Developed the founder AI chat interface and integrated it with AI-powered workflows and founder profiles.',
    ],
    tech: ['Next.js', 'Node.js', 'AI Workflows', 'Auth'],
  },
  {
    id: 'adxplorers',
    company: 'Adxplorers',
    title: 'Full-Stack AI Intern',
    period: 'Jun 2026 — Jul 2026',
    location: 'Remote',
    bullets: [
      'Designed and implemented evaluation datasets and test cases for multiple LLMs, scoring responses against defined quality and performance criteria.',
      'Analyzed evaluation results to improve the reliability and quality of model outputs.',
    ],
    tech: ['Python', 'LLM Evals', 'Claude', 'Llama'],
  },
]

export interface Milestone {
  year: string
  title: string
  detail: string
  highlight?: boolean
}

export const timeline: Milestone[] = [
  { year: '2025', title: 'VibeForge\'26 — Winner', detail: 'Emerged Winner among 500+ participants in an 8-hour hackathon.', highlight: true },
  { year: '2025', title: 'Shloka Decode 2.0, NSUT — Winner', detail: 'Emerged Winner among 500+ participants in an 8-hour hackathon.', highlight: true },
  { year: '2025', title: 'IEEE T-Hacks 8.0 — 2nd Place', detail: '2nd Place among 800+ participants in a 24-hour hackathon.', highlight: true },
  { year: '2025', title: 'Pitch Tank, DU — 2nd Place', detail: '2nd Place among 500+ participants.' },
  { year: '2025', title: 'eDC\'s Blueprint 6.0, IIT Delhi', detail: 'Competed till Delhi Regionals. Invited to Emergence (IITD incubation) & BeCon\'26.' },
  { year: '2025', title: 'B-Plan e-Summit 2025, DTU', detail: 'Top 10 among 500 participants.' },
]

export const interests = [
  'AR & spatial computing',
  'AI in the real world',
  'Computer vision',
  'Fintech innovation',
  'AI agents & tools',
  'Technical writing',
]

export const sections = [
  { id: 'hero', label: 'Start' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'proof', label: 'Proof' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof sections)[number]['id']
