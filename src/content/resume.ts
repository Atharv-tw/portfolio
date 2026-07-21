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

export interface StatItem {
  value: number
  prefix?: string
  suffix?: string
  label: string
  sub?: string
}

export const stats: StatItem[] = [
  { value: 120, suffix: '+', label: 'APIs shipped', sub: 'healthcare · fintech · civic' },
  { value: 5, label: 'Production-grade builds', sub: 'from idea to real users' },
  { value: 8, label: 'AI agents, one system', sub: 'built in a 36h live hackathon' },
  { value: 2, prefix: '#', label: 'of 200+ — IEEE T-Hacks 8.0', sub: '24-hour build, podium finish' },
  { value: 100, suffix: '+', label: 'Positive reviews', sub: 'Finstar, from real teens' },
  { value: 100, suffix: '+', label: 'Pre-registrations', sub: 'Codeswipe, before launch' },
]

/** Skills + the projects that use them — drives the tech matrix in Proof */
export interface SkillNode {
  id: string
  label: string
  weight: number // 1..5 → node size
  group: 'lang' | 'frontend' | 'backend' | 'data' | 'ai' | 'ops' | 'project'
}

export const skillNodes: SkillNode[] = [
  { id: 'python', label: 'Python', weight: 5, group: 'lang' },
  { id: 'ts', label: 'TypeScript / JS', weight: 5, group: 'lang' },
  { id: 'react', label: 'React', weight: 5, group: 'frontend' },
  { id: 'nextjs', label: 'Next.js', weight: 3, group: 'frontend' },
  { id: 'tailwind', label: 'Tailwind', weight: 3, group: 'frontend' },
  { id: 'framer', label: 'Framer Motion', weight: 3, group: 'frontend' },
  { id: 'node', label: 'Node.js', weight: 4, group: 'backend' },
  { id: 'fastapi', label: 'FastAPI', weight: 4, group: 'backend' },
  { id: 'postgres', label: 'Postgres', weight: 3, group: 'data' },
  { id: 'mongodb', label: 'MongoDB', weight: 3, group: 'data' },
  { id: 'firebase', label: 'Firebase', weight: 3, group: 'data' },
  { id: 'supabase', label: 'Supabase', weight: 3, group: 'data' },
  { id: 'rag', label: 'RAG', weight: 4, group: 'ai' },
  { id: 'vectordb', label: 'Vector DBs', weight: 3, group: 'ai' },
  { id: 'agents', label: 'AI Agents', weight: 5, group: 'ai' },
  { id: 'docker', label: 'Docker', weight: 3, group: 'ops' },
  { id: 'git', label: 'Git', weight: 3, group: 'ops' },
  // project hubs
  { id: 'onyx', label: 'Onyx', weight: 4, group: 'project' },
  { id: 'finstar', label: 'Finstar', weight: 4, group: 'project' },
  { id: 'health-companion', label: 'Health Companion', weight: 4, group: 'project' },
  { id: 'codeswipe', label: 'Codeswipe', weight: 4, group: 'project' },
  { id: 'healthvault', label: 'HealthVault', weight: 4, group: 'project' },
]

export const skillEdges: Array<[string, string]> = [
  ['onyx', 'python'], ['onyx', 'fastapi'], ['onyx', 'agents'], ['onyx', 'docker'], ['onyx', 'git'],
  ['finstar', 'react'], ['finstar', 'firebase'], ['finstar', 'supabase'], ['finstar', 'ts'],
  ['health-companion', 'python'], ['health-companion', 'rag'], ['health-companion', 'vectordb'],
  ['health-companion', 'agents'], ['health-companion', 'fastapi'],
  ['codeswipe', 'react'], ['codeswipe', 'framer'], ['codeswipe', 'tailwind'], ['codeswipe', 'ts'],
  ['healthvault', 'node'], ['healthvault', 'postgres'], ['healthvault', 'ts'],
  // skill ↔ skill affinities to make the web feel organic
  ['react', 'ts'], ['react', 'nextjs'], ['node', 'ts'], ['fastapi', 'python'],
  ['rag', 'vectordb'], ['agents', 'rag'], ['mongodb', 'node'], ['git', 'docker'],
]

export interface Milestone {
  year: string
  title: string
  detail: string
  highlight?: boolean
}

export const timeline: Milestone[] = [
  { year: '2023', title: 'Class XII', detail: 'AES Dr. KRBM Sr. Sec. School, Delhi. The launchpad.' },
  { year: '2024', title: 'B.Tech CSE — GGSIPU', detail: 'Started engineering. Immediately started shipping.' },
  { year: '2025', title: 'IEEE T-Hacks 8.0 — 2nd of 200+', detail: '24-hour build. Podium finish.', highlight: true },
  { year: '2025', title: 'Shloka Decode 2.0 — Winner', detail: 'First place. No notes.', highlight: true },
  { year: '2025', title: 'B-Plan e-Summit — Top 10 of 200+', detail: 'Finalist with 100+ pre-registrations on the pitch.' },
  { year: '2025', title: 'CTO — Nexera', detail: 'Nov 2025. Owning every technical and product decision.', highlight: true },
  { year: '2026', title: 'Now', detail: 'Building the next thing. Probably tonight.' },
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
  { id: 'proof', label: 'Proof' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof sections)[number]['id']
