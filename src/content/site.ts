/**
 * Single source of truth for everything written on the site.
 * Edit here → every page updates.
 */

export const person = {
  name: 'Atharv Tiwari',
  firstName: 'Atharv',
  displayName: 'ATHARV',
  role: 'Full-Stack Developer × AI Engineer',
  location: 'New Delhi, India',
  availability: 'Open to internships and good problems',
  statement: 'I build AI systems that actually ship.',
  email: 'tiwariatharv01042005@gmail.com',
  github: { label: 'GitHub', handle: 'Atharv-tw', url: 'https://github.com/Atharv-tw' },
  linkedin: { label: 'LinkedIn', handle: 'atharvtw', url: 'https://www.linkedin.com/in/atharvtw' },
  resumePdf: '/resume.pdf',
  about: [
    "I'm a second-year CSE student at GGSIPU who got a little too obsessed with shipping things people actually use. Most of what I build starts as a hackathon weekend and refuses to stay one.",
    'These days I spend my time on security tooling, health data and outreach software — the kind of systems where a sloppy edge case costs someone their privacy, their money, or their morning. So I sit with the parts most people skip: the rate limits, the revocation flows, the what-happens-if.',
    "I'm also CTO at Nexera, where I own the architecture, the infrastructure, and the calls nobody else wants to make. 120+ APIs shipped so far across healthcare, fintech and civic tech.",
  ],
  skills: ['Backend & APIs', 'AI Agents & RAG', 'Security Engineering', 'Product Design'],
} as const

export interface Principle {
  title: string
  body: string
  note: string
}

export const principles: Principle[] = [
  {
    title: 'Build the brakes in',
    body: "The interesting part of a system is what it refuses to do. Caps that can't be raised, keys the server never sees, sequences that end permanently on a reply. If a limit lives in a settings page, it isn't a limit.",
    note: 'limits are the product.',
  },
  {
    title: 'Ship it, then argue',
    body: 'A working thing on a Sunday night beats a perfect plan on a Friday. Most of what I know about these problems I learned from something already running, badly, in front of real users.',
    note: 'weekends count.',
  },
  {
    title: 'Sit with the edge cases',
    body: "Nobody uses your product rested, on good wifi, with time to spare. The revocation flow, the failed send, the expired token — that's where the work actually is.",
    note: 'no perfect users here!',
  },
]

export interface Metric {
  value: string
  label: string
}

export interface Project {
  id: string
  index: string
  name: string
  kind: string
  year: string
  accent: string
  /** ink color that stays readable on top of `accent` */
  accentInk: string
  kicker: string
  role: string
  bullets: string[]
  impact: string
  challenge: string
  approach: string
  results: string
  metrics: Metric[]
  tech: string[]
  tags: string[]
  links: { repo: string; live: string }
}

export const projects: Project[] = [
  {
    id: 'onyx',
    index: '01',
    name: 'Onyx',
    kind: 'AI-powered DAST security platform',
    year: '2025',
    accent: '#2b57d6',
    accentInk: '#fdfdfb',
    kicker: 'Finds the vulnerability. Then ships the fix.',
    role: 'Solo build — engine, triage, remediation',
    bullets: [
      'High-concurrency scanning engine wiring Subfinder, Nmap and Nuclei together with custom logical probes for SQLi, SSRF and IDOR.',
      'An AI triage layer reads raw scanner output and deduplicates findings at 90%+ accuracy, so the report is short enough to actually read.',
      'Automated remediation through a GitHub App — it opens a verified security pull request on the affected repo instead of filing a ticket.',
    ],
    impact: '~70% reduction in mean time to repair',
    challenge:
      'Scanners are good at producing findings and bad at producing decisions. You run Nuclei and Nmap, get back a wall of overlapping output, and the actual fix still lands weeks later — if anyone gets to it at all.',
    approach:
      'Chain the scanners into one high-concurrency engine and add custom logical probes for the classes generic tooling misses. Put an AI triage layer between the raw output and the human, so what surfaces is deduplicated and ranked rather than exhaustive. Then close the loop: instead of filing a ticket, open the pull request.',
    results:
      'Triage lands at 90%+ deduplication accuracy, and remediation arrives as a verified PR on the affected repo. That combination is what pulls mean time to repair down by roughly 70% — the fix is waiting for review before anyone has finished reading the report.',
    metrics: [
      { value: '~70%', label: 'lower mean time to repair' },
      { value: '90%+', label: 'triage dedup accuracy' },
      { value: '3', label: 'scanners unified' },
    ],
    tech: ['Python', 'FastAPI', 'Nuclei', 'Nmap', 'Claude', 'GitHub API', 'Docker'],
    tags: ['Security', 'Dev Tools'],
    links: { repo: '', live: '' },
  },
  {
    id: 'outreach',
    index: '02',
    name: 'Outreach',
    kind: 'Personal cold email, with brakes built in',
    year: '2026',
    accent: '#ff6a35',
    accentInk: '#fdfdfb',
    kicker: 'Cold email that gets read, because it can never become spam.',
    role: 'Solo build — API, worker, web, scheduling core',
    bullets: [
      'Sign in with Google, upload a résumé, add the people worth reaching, generate a draft, review it, send it through Gmail. Nothing leaves without a press of send.',
      'The limits are the product, not a setting: three emails per person ever, three business days apart, and a reply, bounce or opt-out ends the sequence permanently.',
      'Reply watching via Gmail push, watch renewal and reconcile sweeps — an out-of-office defers the sequence instead of killing it.',
      'CSV and Excel import with a per-row verdict, so duplicates, suppressed contacts, invalid addresses and rows still missing a hook never make it in.',
    ],
    impact:
      'Cross-account contact guard stores addresses as keyed HMACs — it blocks pile-on without keeping a readable list of recipients',
    challenge:
      "Every cold email tool eventually becomes a spam cannon, because the incentives all point that way: more sends, bigger lists, more automation. The failure mode isn't malice. It's a number somebody turns up one afternoon.",
    approach:
      "Put the brakes somewhere nobody can reach them. Three emails per person, ever. Three business days apart. A reply, bounce or opt-out ends the sequence permanently and immediately. Daily caps ramp from low, are enforced server-side, and have no setting that raises them. Then make the writing good enough that volume isn't the lever — generation combines the résumé profile, target context, the chosen playbook and thread history into a single draft you read before it goes.",
    results:
      'A full sending pipeline: business-day scheduling, randomized times inside your own window, warmup caps and correct Gmail threading. Replies are caught through Gmail push, watch renewal and reconcile sweeps, where an out-of-office defers the sequence rather than ending it. Recipient addresses are stored as keyed HMACs, so the cross-account pile-on guard works without the platform ever holding a readable list of who anyone is contacting.',
    metrics: [
      { value: '3', label: 'emails per person, ever' },
      { value: '0', label: 'bulk send modes' },
      { value: 'HMAC', label: 'keyed recipient storage' },
    ],
    tech: ['FastAPI', 'Next.js', 'Postgres', 'Redis', 'arq', 'Gemini', 'Gmail API', 'Docker'],
    tags: ['Product', 'Infrastructure'],
    links: { repo: '', live: '' },
  },
  {
    id: 'finstar',
    index: '03',
    name: 'Finstar',
    kind: 'Gamified finance education for teens',
    year: '2025',
    accent: '#f7c948',
    accentInk: '#191510',
    kicker: 'Finance education Gen-Z teens actually finish.',
    role: 'Full-stack — game modules, data layer, simulation',
    bullets: [
      'Four interactive modules — Life Swipe, Budget Hero, Market Explorer and Quiz Battle — with emotion-aware scoring wired straight into the learning path.',
      'Firebase for the app data, Supabase edge functions for the operations that have to be atomic and correct.',
      'An AI-backed market simulation that reacts like a real market, which is to say: chaotically.',
    ],
    impact: '100+ positive reviews from real users',
    challenge:
      "Teenagers don't finish finance courses. The material is written for people who already care, and the payoff for paying attention arrives about a decade later.",
    approach:
      'Turn the curriculum into four games and wire emotion-aware scoring into the learning path, so difficulty follows how the player is actually doing rather than where they are in a syllabus. Back it with a market simulation that behaves like a real market instead of a tidy textbook one.',
    results:
      'Firebase carries the app data while Supabase edge functions handle everything that has to be atomic, so progress and scores stay correct under concurrent play. 100+ positive reviews from real users.',
    metrics: [
      { value: '100+', label: 'positive reviews' },
      { value: '4', label: 'game modules' },
    ],
    tech: ['React', 'Firebase', 'Supabase', 'TypeScript', 'AI simulation'],
    tags: ['Fintech', 'EdTech'],
    links: { repo: '', live: '' },
  },
  {
    id: 'health-companion',
    index: '04',
    name: 'AI Health Companion',
    kind: 'Context-aware multi-agent health platform',
    year: '2025',
    accent: '#16b06a',
    accentInk: '#fdfdfb',
    kicker: 'Eight agents that explain your health — without playing doctor.',
    role: 'Architecture, agent routing, guardrails',
    bullets: [
      'Explains symptoms and medical reports without ever diagnosing: RAG over the user’s own history, wrapped in strict guardrails.',
      'Deterministic risk detection that surfaces early warning patterns across logs, vitals and lifestyle data.',
      'Medical-safe workflows end to end — report analysis, multi-assistant routing, and emergency escalation logic.',
    ],
    impact: '8 context-aware agents in one system, built inside a 36-hour live hackathon',
    challenge:
      "People bring symptoms and lab reports to the internet and get back either a diagnosis they shouldn't trust or a wall of hedging. The safe answer and the useful answer are rarely the same answer.",
    approach:
      "Split the work across eight context-aware agents behind strict guardrails, running RAG over the user's own history so the explanation is about them and not about the average patient. Explain, never diagnose. Layer deterministic risk detection on top, so early warning patterns get surfaced by rules rather than by a model's judgement.",
    results:
      'Report analysis, multi-assistant routing and emergency escalation logic, all inside medical-safe workflows — built end to end during a 36-hour live hackathon.',
    metrics: [
      { value: '8', label: 'context-aware agents' },
      { value: '36h', label: 'empty repo to working demo' },
    ],
    tech: ['Python', 'RAG', 'Vector DBs', 'FastAPI', 'AI Agents'],
    tags: ['Healthcare', 'AI Agents'],
    links: { repo: '', live: '' },
  },
  {
    id: 'codeswipe',
    index: '05',
    name: 'Codeswipe',
    kind: 'Swipe-based developer collaboration',
    year: '2025',
    accent: '#ff4d8d',
    accentInk: '#fdfdfb',
    kicker: 'Swipe right on your next collaborator.',
    role: 'Frontend — interaction design and build',
    bullets: [
      'Mobile-first, swipe-driven frontend for matching developers to projects and to each other.',
      'Gesture-driven cards with physics-y animation and layouts that hold up on every screen size.',
      'A reusable component set and state-driven flows tuned for clarity over cleverness.',
    ],
    impact: '100+ pre-registrations before launch',
    challenge:
      "Finding a collaborator is a discovery problem wearing a networking problem's clothes. The people who'd be right for your project are one search away, and you will never type the right query.",
    approach:
      'Make it a swipe instead of a search. Mobile-first gesture-driven cards with physics-y motion, matching developers to projects and to each other, built on a reusable component set and state-driven flows.',
    results: '100+ pre-registrations before launch.',
    metrics: [{ value: '100+', label: 'pre-registrations before launch' }],
    tech: ['React', 'Framer Motion', 'Tailwind CSS', 'TypeScript'],
    tags: ['Consumer App', 'Community'],
    links: { repo: '', live: '' },
  },
  {
    id: 'healthvault',
    index: '06',
    name: 'HealthVault',
    kind: 'Zero-knowledge encrypted health records',
    year: '2024',
    accent: '#a9dfc6',
    accentInk: '#191510',
    kicker: 'Your records. Your keys. Nobody else.',
    role: 'Backend — crypto, APIs, access control',
    bullets: [
      'AES-256-GCM encryption on the client, so the server holds ciphertext and nothing else — by design, not by policy.',
      '30+ APIs covering secure access, sharing, and instant revocation of medical data.',
      'QR-based access control, plus AI summaries in both patient-friendly and clinical registers.',
    ],
    impact: '40% easier comprehension of medical reports via AI summaries',
    challenge:
      "Health record systems ask you to trust the operator. Encryption at rest doesn't fix that when the operator also holds the keys — it just moves who you're trusting and hopes you don't notice.",
    approach:
      'Encrypt on the client with AES-256-GCM so the server only ever receives ciphertext — a property of the architecture rather than a promise in a policy. Make access something you grant and revoke instantly, with QR-based control for handing a record to a clinician standing in front of you.',
    results:
      '30+ APIs covering secure access, sharing and revocation, plus AI summaries written in two registers — patient-friendly and clinical — which made reports about 40% easier to comprehend.',
    metrics: [
      { value: '40%', label: 'easier report comprehension' },
      { value: '30+', label: 'APIs shipped' },
      { value: '0', label: 'plaintext on the server' },
    ],
    tech: ['Node.js', 'AES-256-GCM', 'Postgres', 'QR access', 'AI summaries'],
    tags: ['Healthcare', 'Privacy'],
    links: { repo: '', live: '' },
  },
]

export const projectById = (id: string) => projects.find((p) => p.id === id)

export interface Role {
  id: string
  company: string
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
      'Lead technical development of a production platform serving 2K+ daily users — architecture, infrastructure, and the product calls that come with it.',
      'Engineered secure premium-content delivery with Redis-based concurrent-stream protection and access-control workflows.',
      'Built a centralized admin panel with role-based access control for managing premium content.',
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
      'Built the end-to-end founder onboarding experience across landing, authentication and profile completion, wiring the frontend into the backend workflows.',
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
  { year: '2025', title: "VibeForge'26 — Winner", detail: 'Won among 500+ participants in an 8-hour hackathon.', highlight: true },
  { year: '2025', title: 'Shloka Decode 2.0, NSUT — Winner', detail: 'Won among 500+ participants in an 8-hour hackathon.', highlight: true },
  { year: '2025', title: 'IEEE T-Hacks 8.0 — 2nd Place', detail: '2nd among 800+ participants in a 24-hour hackathon.', highlight: true },
  { year: '2025', title: 'Pitch Tank, DU — 2nd Place', detail: '2nd among 500+ participants.' },
  { year: '2025', title: "eDC's Blueprint 6.0, IIT Delhi", detail: 'Competed to Delhi Regionals. Invited to Emergence (IITD incubation) and BeCon’26.' },
  { year: '2025', title: 'B-Plan e-Summit 2025, DTU', detail: 'Top 10 among 500 participants.' },
]

export const stats = [
  { value: '120+', label: 'APIs shipped', note: 'across healthcare, fintech and civic tech' },
  { value: '2K+', label: 'Daily users', note: 'on the platform I run as CTO' },
  { value: '6', label: 'Products built', note: 'security, health, fintech, outreach' },
]

export const interests = [
  'AR & spatial computing',
  'AI in the real world',
  'Computer vision',
  'Fintech innovation',
  'AI agents & tools',
  'Technical writing',
]

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/work', label: 'Work' },
  { to: '/playground', label: 'Playground' },
] as const
