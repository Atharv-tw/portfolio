/**
 * Single source of truth for everything written on the site.
 * Edit here → whole site updates.
 *
 * Empty strings and empty arrays are fine everywhere: the UI hides what has no
 * content (in `npm run dev` it outlines the gap so you can see what is missing).
 */

export const person = {
  name: 'Atharv Tiwari',
  firstName: 'Atharv',
  role: 'AI / ML Engineer × Product Builder',
  tagline: 'I build AI systems that ship.',
  heroSub:
    'I build real systems and put them in front of real users. AI, backend and product, end to end.',
  location: 'New Delhi, India',
  timezone: 'Asia/Kolkata',
  email: 'tiwariatharv01042005@gmail.com',
  github: { label: 'GitHub', handle: 'Atharv-tw', url: 'https://github.com/Atharv-tw' },
  linkedin: { label: 'LinkedIn', handle: 'atharvtw', url: 'https://www.linkedin.com/in/atharvtw' },
  resumePdf: '/resume.pdf',
  aboutLead: "I'm Atharv. I turn ideas into things people actually use.",
  about: [
    'Right now that means being CTO at Nexera, where I own the technical and product calls for a platform 3K+ people use every day. Around it I have built for healthcare, civic governance and fintech.',
    'Most of my work sits where AI meets backend and product: agents that need guardrails, systems that have to stay up, interfaces someone has to understand at a glance. I am a third-year CSE student in Delhi, and I would rather ship something real over a weekend than talk about it for a month.',
  ],
  aboutFacts: [
    { label: 'Based in', value: 'New Delhi, India' },
    { label: 'Currently', value: 'CTO @ Nexera' },
    { label: 'Studying', value: 'CSE, GGSIPU — class of 2028' },
  ],
  openTo: ['Internships', 'Freelance work', 'Ambitious ideas', 'Collaborations'],
} as const

export type ProjectMotif = 'radar' | 'depth' | 'forecast' | 'orbit' | 'arcade' | 'deck' | 'vault'

export interface ProjectResult {
  /** the big part: "~70%", "8", "36 h" */
  value: string
  label: string
}

export interface Project {
  id: string
  index: string
  name: string
  /** category line under the name */
  kind: string
  /** leave '' while a project has no public date */
  year: string
  /** featured = one of the four big tiles; archive = the "more work" list */
  tier: 'featured' | 'archive'
  /** shows a BUILDING tag instead of the year */
  building?: boolean
  /** the project's own colour — only ever used inside its tile, visual and modal */
  accent: string
  /** deep tinted surface the tile and modal sit on */
  stage: string
  motif: ProjectMotif
  /** the one line that makes someone lean in */
  statement: string
  /** one or two plain sentences: what it actually does */
  summary: string
  /** modal — the problem and what the project does */
  overview: string[]
  /** modal — what I built */
  built: string[]
  /** modal — why it matters */
  why: string
  /** modal — real numbers only */
  results: ProjectResult[]
  /** tile shows the first four */
  topics: string[]
  links: { repo: string; live: string; caseStudy: string }
  /**
   * Demo footage. Drop the file in `public/videos/` and point at it:
   *   media: { video: '/videos/onyx.mp4', poster: '/videos/onyx.jpg' }
   * Until then the modal shows the live visual in its place.
   */
  media: { video?: string; poster?: string }
}

export const projects: Project[] = [
  {
    id: 'onyx',
    index: '01',
    name: 'Onyx',
    kind: 'AI-powered cybersecurity',
    year: '2025',
    tier: 'featured',
    accent: '#f2364b',
    stage: '#17060a',
    motif: 'radar',
    statement: 'Finds vulnerabilities. Then ships the fix.',
    summary:
      'Scans a web application, uses AI to work out which findings are real, and opens a pull request with the fix.',
    overview: [
      'Onyx checks the security of a web application end to end. It scans, works out which findings actually matter, and raises the pull request that fixes them.',
    ],
    built: [
      'High-concurrency scanning engine integrating Subfinder, Nmap and Nuclei with custom logical probes for SQLi, SSRF and IDOR.',
      'AI triage layer (Claude / Llama) that reads raw scanner output and deduplicates findings with 90%+ accuracy.',
      'Automated remediation via GitHub App — opens verified security pull requests on the affected repo.',
    ],
    why: 'The time between finding a vulnerability and fixing it is where the risk lives. Onyx takes a finding all the way to a reviewed pull request instead of stopping at a report.',
    results: [
      { value: '~70%', label: 'reduction in mean time to repair' },
      { value: '90%+', label: 'accuracy deduplicating scanner findings' },
    ],
    topics: ['Python', 'FastAPI', 'Nuclei', 'Nmap', 'Claude', 'GitHub API', 'Docker'],
    links: { repo: 'https://github.com/Atharv-tw/Onyx', live: '', caseStudy: '' },
    media: {},
  },
  {
    id: 'okeanos',
    index: '02',
    name: 'OKEANOS',
    kind: 'Satellite ocean intelligence',
    year: '',
    tier: 'featured',
    building: true,
    accent: '#3fa7c4',
    stage: '#04131b',
    motif: 'depth',
    statement: 'See beneath the ocean surface from space.',
    summary:
      'Reconstructs the temperature beneath the ocean surface from what satellites can observe above it.',
    // TODO(Atharv): everything below is yours to fill — nothing here is invented.
    overview: [],
    built: [],
    why: '',
    results: [],
    topics: [],
    links: { repo: '', live: '', caseStudy: '' },
    media: {},
  },
  {
    id: 'netwm',
    index: '03',
    name: 'NETWM',
    kind: 'Network attack forecasting',
    year: '',
    tier: 'featured',
    building: true,
    accent: '#f5a524',
    stage: '#171003',
    motif: 'forecast',
    statement: 'Predict the next move before the attacker makes it.',
    summary:
      'A world model for networks: it reads the state of a network and forecasts how an attack could move through it next, instead of detecting it after the fact.',
    // TODO(Atharv): everything below is yours to fill — nothing here is invented.
    overview: [],
    built: [],
    why: '',
    results: [],
    topics: [],
    links: { repo: '', live: '', caseStudy: '' },
    media: {},
  },
  {
    id: 'health-companion',
    index: '04',
    name: 'AI Health Companion',
    kind: 'Multi-agent AI for health',
    year: '2025',
    tier: 'featured',
    accent: '#6cc392',
    stage: '#06130c',
    motif: 'orbit',
    statement: 'Eight agents. One health context.',
    summary:
      'Eight specialised agents work around one shared picture of your health to explain symptoms and reports, without ever playing doctor.',
    overview: [
      'A safety-first platform that explains symptoms and medical reports without diagnosing. Every agent reads from the same user history, with strict guardrails on what it is allowed to say.',
    ],
    built: [
      'Safety-first platform that explains symptoms and medical reports without diagnosing — RAG over user history with strict guardrails.',
      'Deterministic risk detection surfacing early warning patterns across logs, vitals and lifestyle data.',
      'Medical-safe workflows: report analysis, multi-assistant routing, emergency escalation logic.',
    ],
    why: 'Health is where a confident wrong answer does real damage. The system is built to explain and to escalate, never to diagnose.',
    results: [
      { value: '8', label: 'context-aware agents in one system' },
      { value: '36 h', label: 'built overnight at a live hackathon' },
    ],
    topics: ['Python', 'RAG', 'Vector DBs', 'FastAPI', 'AI Agents'],
    links: {
      repo: 'https://github.com/Atharv-tw/Health-companion',
      live: 'https://health-companion-navy.vercel.app',
      caseStudy: '',
    },
    media: {},
  },
  {
    id: 'finstar',
    index: '05',
    name: 'Finstar',
    kind: 'Gamified finance education for teens',
    year: '2025',
    tier: 'archive',
    accent: '#ffb114',
    stage: '#161004',
    motif: 'arcade',
    statement: 'Finance education Gen-Z teens actually finish.',
    summary: '',
    overview: [],
    built: [
      'Four interactive game modules — Life Swipe, Budget Hero, Market Explorer, Quiz Battle — with emotion-aware scoring wired into the learning path.',
      'Robust Firebase database backed by Supabase edge functions for data integrity and atomic operations.',
      'AI-backed market simulation that reacts like a real (chaotic) market.',
    ],
    why: '',
    results: [{ value: '100+', label: 'positive reviews from real users' }],
    topics: ['React', 'Firebase', 'Supabase', 'TypeScript', 'AI simulation'],
    links: { repo: 'https://github.com/Atharv-tw/FINSTAR', live: '', caseStudy: '' },
    media: {},
  },
  {
    id: 'codeswipe',
    index: '06',
    name: 'Codeswipe',
    kind: 'Swipe-based developer collaboration platform',
    year: '2025',
    tier: 'archive',
    accent: '#ff4d9d',
    stage: '#16060e',
    motif: 'deck',
    statement: 'Swipe right on your next collaborator.',
    summary: '',
    overview: [],
    built: [
      'Swipe-based, mobile-first frontend for matching developers to projects and people.',
      'Gesture-driven cards, physics-y animations and responsive layouts with Framer Motion + Tailwind.',
      'Reusable UI components and state-driven flows tuned for UX performance and clarity.',
    ],
    why: '',
    results: [{ value: '100+', label: 'pre-registrations before launch' }],
    topics: ['React', 'Framer Motion', 'Tailwind CSS', 'TypeScript'],
    links: { repo: '', live: '', caseStudy: '' },
    media: {},
  },
  {
    id: 'healthvault',
    index: '07',
    name: 'HealthVault',
    kind: 'Zero-knowledge encrypted health records',
    year: '2024',
    tier: 'archive',
    accent: '#35c6dc',
    stage: '#04131a',
    motif: 'vault',
    statement: 'Your records. Your keys. Nobody else.',
    summary: '',
    overview: [],
    built: [
      'Zero-knowledge health record system with AES-256-GCM client-side encryption — the server never sees plaintext.',
      '30+ APIs for secure medical data access, sharing, and instant revocation.',
      'QR-based access control plus AI summaries in patient-friendly and clinical flavors.',
    ],
    why: '',
    results: [{ value: '40%', label: 'easier comprehension of medical reports via AI summaries' }],
    topics: ['Node.js', 'AES-256-GCM', 'Postgres', 'QR access', 'AI summaries'],
    links: { repo: '', live: '', caseStudy: '' },
    media: {},
  },
]

export const featured = projects.filter((p) => p.tier === 'featured')
export const archive = projects.filter((p) => p.tier === 'archive')

/** What I am working on right now. Keep it to three. */
export const now = {
  updated: 'October 2026',
  items: [
    {
      id: 'okeanos',
      name: 'OKEANOS',
      line: 'Satellite ocean intelligence. Reconstructing subsurface temperature from the surface.',
      /** opens this project's modal when set */
      projectId: 'okeanos',
    },
    {
      id: 'netwm',
      name: 'NETWM',
      line: 'A world model for network attack forecasting.',
      projectId: 'netwm',
    },
    {
      id: 'personal-ai',
      name: 'Personal AI',
      line: 'Agentic systems, and where personal AI goes next.',
      projectId: '',
    },
  ],
} as const

export interface Role {
  id: string
  company: string
  /** shown next to the company when there is a public site worth naming */
  site?: string
  title: string
  period: string
  location: string
  current?: boolean
  /** the lead role gets a headline number and a row of what it covers */
  headline?: { value: string; label: string }
  scope?: string[]
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
    headline: { value: '3K+', label: 'daily users on the platform I own' },
    scope: ['Architecture', 'Infrastructure', 'Product decisions', 'Secure content delivery', 'Admin & RBAC'],
    bullets: [
      'Led technical development of a production platform serving 3K+ daily users — owning architecture, infrastructure and the key product calls.',
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

/** Compact proof. Not a trophy cabinet. */
export const trackRecord = {
  stats: [
    { value: 3, suffix: 'K+', label: 'daily users on Nexera' },
    { value: 5, suffix: '×', label: 'hackathon podiums' },
  ],
  role: { value: 'CTO', label: 'Nexera, since Nov 2025' },
  /** `lead: true` is the one card that gets the weight — keep it to one */
  highlights: [
    {
      title: 'Blueprint 2026, eDC IIT Delhi',
      result: 'Selected for incubation',
      detail: "Emergence, eDC IIT Delhi's startup incubation cohort",
      lead: true,
    },
    { title: 'Shloka Decode 2.0, NSUT', result: 'Winner', detail: '500+ participants · 8-hour hackathon', lead: false },
    { title: 'IEEE T-Hacks 8.0', result: 'Winners', detail: '800+ participants · 24-hour hackathon', lead: false },
  ],
  also: ["VibeForge'26 — Winner", 'Bytecode, HackWithBVP 7.0 — 4th position', 'B-Plan e-Summit 2025, DTU — Top 10'],
} as const

export interface OutsideItem {
  id: string
  label: string
  note: string
}

/** Outside the terminal: the person, not the engineer. Keep it short. */
export const outside: OutsideItem[] = [
  {
    id: 'taekwondo',
    label: 'Taekwondo',
    note: 'Three-time international medalist for India.',
  },
  {
    id: 'basketball',
    label: 'Basketball',
    note: 'Hooping every weekend.',
  },
]

export const interests = [
  'AR & spatial computing',
  'AI in the real world',
  'Computer vision',
  'Fintech innovation',
  'AI agents & tools',
  'Technical writing',
]

/**
 * Page order. `nav` decides what the floating nav shows; the homepage stays
 * the journey, so not every section is a destination.
 */
export const sections = [
  { id: 'hero', label: 'Start', nav: false },
  { id: 'about', label: 'About', nav: true },
  { id: 'now', label: 'Now', nav: true },
  { id: 'work', label: 'Work', nav: true },
  { id: 'archive', label: 'More work', nav: false },
  { id: 'experience', label: 'Experience', nav: true },
  { id: 'track', label: 'Track record', nav: false },
  { id: 'outside', label: 'Outside', nav: false },
  { id: 'contact', label: 'Contact', nav: true },
] as const

export type SectionId = (typeof sections)[number]['id']

/** Where the bot can be: any section, or inside one of the featured projects. */
export type SceneId = SectionId | 'onyx' | 'okeanos' | 'netwm' | 'health-companion'
