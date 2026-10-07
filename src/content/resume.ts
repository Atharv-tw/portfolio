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
  /** the three facts at the foot of the hero — keep it to three short ones */
  heroProof: [
    { value: '3K+', label: 'daily users' },
    { value: '12+', label: 'projects built' },
    { value: 'CTO', label: '@ Nexera' },
  ],
  location: 'New Delhi, India',
  timezone: 'Asia/Kolkata',
  email: 'tiwariatharv01042005@gmail.com',
  github: { label: 'GitHub', handle: 'Atharv-tw', url: 'https://github.com/Atharv-tw' },
  linkedin: { label: 'LinkedIn', handle: 'atharvtw', url: 'https://www.linkedin.com/in/atharvtw' },
  resumePdf: '/resume.pdf',
  aboutLead: "I'm Atharv. I turn ideas into things people actually use.",
  about: [
    'Right now, I’m building @ Nexera as its Founding CTO, where I lead the technical direction and product decisions for a platform used by 3K+ people every day. Along the way, I’ve built products across cybersecurity, healthcare, civic technology and fintech.',
    'Most of my work sits at the intersection of AI, ML, systems and product — training models, building agentic applications, and engineering the infrastructure that puts them into production. I’m a third-year CSE student in Delhi, and I’d rather spend a weekend building something real than a month explaining what I could build.',
  ],
  aboutFacts: [
    { label: 'Based in', value: 'New Delhi, India' },
    { label: 'Currently', value: 'Founding CTO @ Nexera' },
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

/** A small benchmark table in a project's modal. */
export interface ProjectTable {
  head: string[]
  rows: string[][]
  /** rows that are this project's own model: they get the weight */
  ours?: number[]
  /** how the numbers were produced, in a line or two */
  note?: string
}

/**
 * A longer technical section in the modal ("The data", "The model",
 * "Held-out year"). Use any mix of the three: label → value specs, short
 * points, one table.
 */
export interface ProjectDeep {
  title: string
  specs?: { label: string; value: string }[]
  points?: string[]
  table?: ProjectTable
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
  /** one or two plain sentences: what it actually does. Keep it near 150 characters: it sits on the tile */
  summary: string
  /** modal — where it was built: the event, the problem statement, the team */
  context?: string
  /** modal — the problem and what the project does */
  overview: string[]
  /** modal — what I built */
  built: string[]
  /** modal — why it matters */
  why: string
  /** modal — real numbers only */
  results: ProjectResult[]
  /** modal — "under the hood": data, model, evaluation. Leave out for a short write-up. */
  deep?: ProjectDeep[]
  /** tile shows the first four */
  topics: string[]
  links: { repo: string; live: string; caseStudy: string }
  /**
   * Demo footage and screenshots.
   *   youtube: the video id (the part after youtu.be/). Plays muted, on a loop.
   *   video:   or a file of your own: '/videos/onyx.mp4' in `public/videos/`
   *   shots:   screenshots: files in `public/shots/<id>/`, listed here
   * With no video the modal shows the live visual in its place.
   */
  media: { youtube?: string; video?: string; poster?: string; shots?: { src: string; alt: string }[] }
}

export const projects: Project[] = [
  {
    id: 'onyx',
    index: '01',
    name: 'Onyx',
    kind: 'AI-powered cybersecurity',
    year: '2026',
    tier: 'featured',
    accent: '#f2364b',
    stage: '#17060a',
    motif: 'radar',
    statement: 'Finds vulnerabilities. Then ships the fix.',
    summary:
      'Scans a live web application, uses AI to work out which findings are real, and opens a pull request with the fix.',
    overview: [
      'Security scanners produce long lists with no priority and no context. Audits end as PDFs nobody acts on, a security engineer is out of reach for most small teams, and the same bugs come back with the next deploy. So the fix is always “later”.',
      'Onyx is an autonomous security platform. It maps what a site exposes, attacks it the way a penetration tester would, reasons over what it found, and delivers the exact code change as a GitHub pull request.',
    ],
    built: [
      'Scan pipeline that runs Subfinder, Nmap, ffuf and Nuclei in sequence as background jobs on Celery and Redis, with scan history, severity tracking and runs you can cancel.',
      'Active checks written from scratch, 1,600 lines of them: SQL injection including blind time-based, reflected XSS, SSTI, SSRF, path traversal, IDOR, CORS misconfiguration, mass assignment, HTTP method tampering, secrets leaked in JavaScript and missing security headers.',
      'Authenticated scanning: a Playwright browser signs in to the target and hands its session to the scanner, so the checks reach the pages behind the login.',
      'AI triage behind one LLM interface with automatic fallback across Llama 3.1, Claude and GPT-4o. It correlates findings, removes duplicates and false positives, and says what to fix first.',
      'Auto-fix through a GitHub App: inspects the repository, picks the files responsible, generates the patch, validates it, and opens the pull request on its own branch.',
    ],
    why: 'The time between finding a vulnerability and fixing it is where the risk lives. Onyx takes a finding all the way to a reviewed pull request instead of stopping at a report.',
    results: [
      { value: '~70%', label: 'reduction in mean time to repair' },
      { value: '90%+', label: 'accuracy deduplicating scanner findings' },
      { value: '4', label: 'scanners in one pipeline: Subfinder, Nmap, ffuf, Nuclei' },
      { value: '11', label: 'vulnerability classes covered by its own active checks' },
    ],
    topics: ['Python', 'FastAPI', 'Nuclei', 'Claude', 'Celery + Redis', 'Next.js', 'PostgreSQL', 'Nmap', 'Playwright', 'GitHub App', 'Docker'],
    links: { repo: 'https://github.com/Atharv-tw/Onyx', live: '', caseStudy: '' },
    media: { youtube: 'yADRor3sAJU' },
  },
  {
    id: 'okeanos',
    index: '02',
    name: 'OKEANOS',
    kind: 'Satellite ocean intelligence',
    year: '2026',
    tier: 'featured',
    building: true,
    accent: '#3fa7c4',
    stage: '#04131b',
    motif: 'depth',
    statement: 'See beneath the ocean surface from space.',
    summary:
      'Reconstructs ocean temperature at 15 depths from satellite data alone, with 29% lower thermocline error than climatology on a year it never saw.',
    context: 'Smart India Hackathon 2026 · Ministry of Earth Sciences problem statement · Team PIRATES',
    overview: [
      'Satellites see the whole ocean every day, but only its skin. What lies below controls ocean heat content and the energy available to tropical cyclones, and it is measured almost entirely by Argo floats: roughly one profile per 3° × 3° box every ten days.',
      'OKEANOS reads seven daily satellite fields (sea surface temperature, salinity, height, currents and winds) and reconstructs a full temperature profile at fifteen depths, from the surface to 1,000 m, for every 0.25° point of the North Indian Ocean.',
    ],
    built: [
      'Data pipeline that harmonises five satellite products and the GLORYS12V1 reanalysis onto one 0.25° grid: 13 years, 4,748 daily fields, streamed and resumable, built on a laptop with 7.3 GB of RAM.',
      'A U-Net that maps 7 surface channels to a 15-level temperature volume in one pass, with a 32-channel latent that turns each day of satellite data into a 3,584-number embedding.',
      'A baseline ladder on identical days and grid: day-of-year climatology, ridge regression, gradient boosting, then the network.',
      'A leakage-free evaluation: time-based splits, training-only normalisation, three seeds, and a held-out year the scoring tool will only score once.',
      'Independent validation against INCOIS gridded ARGO float observations, with a second Argo product as a cross-check.',
      'A FastAPI inference service and a web platform with a 2-D map and a 3-D ocean explorer, deployed on AWS and Vercel.',
    ],
    why: 'Upper-ocean heat, not surface temperature alone, sets how fast a cyclone can intensify over the Bay of Bengal and the Arabian Sea. A daily subsurface field built from satellites that are already flying is a software layer over open data, and far cheaper than more floats.',
    results: [
      { value: '29%', label: 'lower thermocline error than climatology on a held-out year (23% below the surface)' },
      { value: '0.979', label: '°C thermocline RMSE on unseen 2022, mean of three seeds' },
      { value: '47.5×', label: 'compact embedding: 170,387 satellite values a day become 3,584 numbers' },
      { value: '18 ms', label: 'for a full 15-level ocean field on a 4 GB laptop GPU' },
      { value: '4,748', label: 'days of data: 13 years from five satellite products' },
      { value: '285', label: 'automated tests, run on every push' },
    ],
    deep: [
      {
        title: 'The data',
        specs: [
          { label: 'Region and grid', value: 'North Indian Ocean, 5–30°N, 45–105°E at 0.25°. 101 × 241 = 24,341 points' },
          { label: 'Period', value: '2010–2022, daily. 4,748 days' },
          { label: 'Inputs, 7 channels', value: 'SST (OSTIA), salinity (SMOS/SMAP), sea surface height (DUACS), currents U and V (OSCAR), winds U and V (CCMP)' },
          { label: 'Target', value: 'GLORYS12V1 reanalysis temperature at 15 depths, 0–1,000 m. Never an input' },
        ],
        points: [
          'One conservative, area-weighted remapping rule for every satellite product: it uses all 36 OSTIA cells under a grid point where interpolation would read 4.',
          'Absolute dynamic topography instead of sea level anomaly: correlation with the ocean’s height field 0.972 instead of 0.571.',
          'Block-averaging the reanalysis instead of sampling its centre point removes target errors of up to 2.55 °C at ocean fronts.',
          'Server-side subsetting of the NASA products: one day of currents drops from 31.71 MB to 332 KB.',
        ],
      },
      {
        title: 'The model',
        specs: [
          { label: 'Input → output', value: '7 × 101 × 241 surface fields → 15 × 101 × 241 temperature volume' },
          { label: 'Architecture', value: 'U-Net, 4 levels, 48 base channels, GroupNorm, skip connections' },
          { label: 'Embedding', value: '32 channels on a 7 × 16 grid: 3,584 numbers per day' },
          { label: 'Loss', value: 'Masked MSE over real ocean water at each depth, depth-weighted' },
          { label: 'Training', value: 'AdamW, dropout 0.2, cosine schedule, 20 epochs, three seeds' },
          { label: 'Size', value: '16.3 million parameters' },
        ],
      },
      {
        title: 'Held-out year: 2022, scored once',
        table: {
          head: ['Model', 'Below-surface RMSE', 'Thermocline RMSE'],
          rows: [
            ['Day-of-year climatology', '0.904 °C', '1.378 °C'],
            ['Ridge regression', '0.877 °C', '1.257 °C'],
            ['Gradient boosting (XGBoost)', '0.688 °C', '0.992 °C'],
            ['OKEANOS U-Net, 3 seeds', '0.692 ± 0.007 °C', '0.979 ± 0.017 °C'],
          ],
          ours: [3],
          note: 'Trained on 2010–2019, chosen on 2020–2021. The network reads the seven satellite fields only; gradient boosting is also given latitude, longitude and day of year.',
        },
        points: [
          'From the validation years to the unseen year, error rose by only 1.4% below the surface and 0.6% in the thermocline: it generalises instead of memorising.',
          'On the validation years the largest gains over climatology are in the thermocline, where cyclone-relevant heat is stored: 35% at 75 m, 36% at 100 m and 36% at 125 m.',
        ],
      },
      {
        title: 'Experiments that shaped it',
        points: [
          '32-channel latent against a 768-channel bottleneck, three seeds each: 0.6830 vs 0.6850 °C. As accurate, and 24× narrower.',
          'Zeroing the skip connections at an identical parameter count raises error by 8.0%: the embedding holds the basin-scale state, the skips carry the fine detail.',
          'Predicting absolute temperature beats predicting the anomaly from climatology: 8.6% better below the surface, 11.8% in the thermocline.',
          '20 training epochs match 60 (0.686 vs 0.688 °C): the same skill for a third of the compute.',
        ],
      },
      {
        title: 'Against real ocean observations',
        points: [
          'Validated against INCOIS gridded ARGO, the float product the problem statement names: 24 matched months, scored only where floats determine the value.',
          'Highest correlation with the floats of the three models compared: 0.870 below the surface, against 0.859 for the GLORYS reanalysis and 0.842 for climatology.',
        ],
      },
    ],
    topics: ['PyTorch', 'U-Net', 'xarray + Dask', 'FastAPI', 'XGBoost', 'scikit-learn', 'Zarr', 'deck.gl', 'Docker', 'AWS'],
    links: { repo: '', live: 'https://okeanos-pirates.vercel.app', caseStudy: '' },
    media: { youtube: 'uufrmJR8MEI' },
  },
  {
    id: 'netwm',
    index: '03',
    name: 'NETWM',
    kind: 'Network attack forecasting',
    year: '2026',
    tier: 'featured',
    building: true,
    accent: '#f5a524',
    stage: '#171003',
    motif: 'forecast',
    statement: 'Predict the next move before the attacker makes it.',
    summary:
      'A world model for networks: it learns how a network’s state evolves and rolls it five minutes ahead. 0.677 PR-AUC on a held-out day, against 0.139 for the baseline.',
    context: 'Smart India Hackathon 2026 · NTRO problem statement · Team PIRATES',
    overview: [
      'Intrusion detectors label each network flow on its own, benign or malicious. That throws away what makes an intrusion an intrusion: the order ports get probed in, the timing of reconnaissance before lateral movement. An attack is a process that unfolds over minutes to hours, not a single packet.',
      'NetWM turns traffic, flow CSVs or raw PCAPs, into one state vector per 60-second window and learns the transition P(S_t+1 | S_t). It then imagines ten windows ahead and answers three questions for every window: how at risk the network is of compromise in the next five minutes, which MITRE ATT&CK stage it is heading into, and which features drive that score.',
    ],
    built: [
      'State builder: 60 s windows at a 30 s stride, 70 flow-level features (TCP flags, inter-arrival times, byte and packet statistics, port entropy, fan-out) plus 35 packet-level features on the PCAP route.',
      'The world model: a Transformer encoder with causal attention over the last 16 windows, feeding an RSSM-style stochastic latent with a learned prior. About 0.6 million parameters.',
      'K-step rollouts: ten imagined windows, five minutes, per forecast, with Monte-Carlo sampling for an uncertainty band.',
      'Multi-task heads on any real or imagined state: a next-state decoder, the MITRE ATT&CK stage, and three risk heads for attack, compromise and escalation.',
      'Explanations a defender can read: attention shows when, Integrated Gradients show which features.',
      'A dataset audit that corrected attack-onset times and kill-chain labels in CIC-IDS2017 before any training.',
      'A fully offline FastAPI backend and dashboard that take a CSV or PCAP upload, with 192 tests, one of which makes every outbound connection fail.',
    ],
    why: 'Rule-based and per-flow systems only react to traffic they have already seen, with no sense of where in the kill chain the network is. NetWM models how the network evolves, so every window comes with a forward-looking risk score, the ATT&CK stage it points to, and the features behind it.',
    results: [
      { value: '0.677', label: 'PR-AUC on a held-out day, against 0.139 for logistic regression' },
      { value: '5×', label: 'the baseline’s F1 at the same alarm threshold (0.59 vs 0.11)' },
      { value: '0.96', label: 'ROC-AUC on brute-force attacks from a family never seen in training (baseline: 0.45)' },
      { value: '85M+', label: 'network flows across CIC-IDS2017, CIC-IDS2018 and CTU-13' },
      { value: '~0.6M', label: 'parameters: trains in about 5 minutes a fold on a 4 GB laptop GPU' },
      { value: '192', label: 'tests, and it runs fully offline' },
    ],
    deep: [
      {
        title: 'Network state',
        specs: [
          { label: 'Window', value: '60 s at a 30 s stride. One state vector S_t per window' },
          { label: 'Flow features, 70', value: 'TCP flag ratios, protocol and service mix, bytes, packets, duration, inter-arrival statistics, bidirectional ratios, port entropy, fan-out' },
          { label: 'Packet features, 35', value: 'TTL, fragments, retransmissions, zero windows, payload histogram, inter-packet timing, SYN-only and RST shares' },
          { label: 'Scaling', value: 'log1p on heavy tails, then a scaler fitted on training days only' },
          { label: 'Labels', value: '7 MITRE ATT&CK stages: Benign, Recon, Initial Access, Lateral Movement, C2, Exfiltration, Impact' },
        ],
      },
      {
        title: 'The world model',
        specs: [
          { label: 'Dynamics', value: 'P(S_t+1 | S_t): Transformer encoder → causal attention over 16 windows → RSSM stochastic latent' },
          { label: 'Rollout', value: 'K = 10 steps (5 minutes) in latent space, Monte-Carlo sampled' },
          { label: 'Heads', value: 'Next-state decoder (its error is the surprise), MITRE stage, and attack, compromise and escalation risk' },
          { label: 'Loss', value: 'Next-state NLL + KL divergence + multi-step rollout + stage cross-entropy + risk BCE' },
          { label: 'Alarm', value: 'Causal alert budget: above the 90th percentile of earlier scores, with no tuning on the test day' },
          { label: 'Size', value: '584,470 parameters' },
        ],
        points: ['Built to stream: scoring a feed in 60-window chunks equals one full pass to 2.3e-10.'],
      },
      {
        title: 'Held-out day',
        table: {
          head: ['Model', 'PR-AUC', 'F1', 'Precision', 'Recall'],
          rows: [
            ['World model, flow route (served model)', '0.677', '0.591', '0.574', '0.608'],
            ['World model, packet route (3-seed mean)', '0.514', '0.583', '0.581', '0.584'],
            ['Logistic regression', '0.139', '0.112', '0.167', '0.084'],
          ],
          ours: [0, 1],
          note: 'CIC-IDS2017, leave-one-day-out: neither model trained on the test day. Every model is scored at the same causal threshold.',
        },
      },
      {
        title: 'What the dynamics earn',
        points: [
          'Against the same encoder predicting risk directly, with no latent dynamics: PR-AUC 0.39 vs 0.22, and pre-attack windows ranked 0.70 vs 0.61.',
          'Imagined rollouts beat a “nothing changes” forecast, averaged over steps 2 to 10.',
          'Packet-level features raised held-out PR-AUC from 0.43 to 0.56 over flows alone.',
          'Attack families held out of training entirely are still recognised on CIC-IDS2018: brute force at 0.96 ROC-AUC (baseline 0.45), DoS at 0.87.',
        ],
      },
      {
        title: 'Data and audit',
        points: [
          'CIC-IDS2017, corrected release: 2.10M flows over 5 days, 4,907 windows, and 53.7M packets from 52.4 GB of raw captures for the packet route.',
          'CIC-IDS2018 (63.2M flows, 10 days) and CTU-13 (20.0M flows, 13 botnet scenarios) to test on attack families the model never trained on.',
          'Audit before training: “Attempted” traffic would have labelled 727 of 968 Friday windows as command and control. Excluding it restored the published attack schedule.',
          'Splitting one portscan label by its source moved an attack onset from 17:00:00 to 17:18:30, matching the documented 17:19 infiltration.',
          'Leave-one-day-out only: windows are never shuffled across days, so near-duplicate flows cannot inflate the score.',
        ],
      },
    ],
    topics: ['PyTorch', 'Transformer', 'World model (RSSM)', 'MITRE ATT&CK', 'Scapy', 'Captum', 'scikit-learn', 'FastAPI', 'pandas'],
    links: { repo: 'https://github.com/ArunmehtaBuild/NetWM', live: '', caseStudy: '' },
    media: { youtube: '9HpoNZa3afw' },
  },
  {
    id: 'health-companion',
    index: '04',
    name: 'AI Health Companion',
    kind: 'Multi-agent AI for health',
    year: '2026',
    tier: 'featured',
    accent: '#6cc392',
    stage: '#06130c',
    motif: 'orbit',
    statement: 'Eight agents. One health context.',
    summary:
      'Eight specialised agents work around one shared picture of your health to explain symptoms and reports, without ever playing doctor.',
    overview: [
      'Health data is everywhere and understanding is not. Symptoms, lab reports and vitals sit scattered across apps and PDFs, early warning patterns go unnoticed, and most health chatbots answer with no context and too much confidence.',
      'AI Health Companion sits between raw health data and a doctor. It explains symptoms and reports in plain language, assesses risk from what you log, and escalates when it should. It never diagnoses, prescribes or suggests a dose.',
    ],
    built: [
      'Eight specialised assistants over one user context: health chat, symptom analysis, risk interpretation, nutrition, mental wellness, report analysis, Ayurvedic remedies and medication help.',
      'Agents that call back into the app: six tool endpoints give them the user’s health summary, logs, risk assessment, profile, reports and reminders.',
      'RAG over a curated knowledge base of triage protocols: chest pain, cold and flu, medication safety, emergency red flags.',
      'A deterministic risk engine that scores logged symptoms, vitals and lifestyle and raises alerts on recurring patterns, with no LLM in the loop.',
      'A safety gate on every input and output, with its own test suite, plus crisis-keyword detection and one-tap SOS to emergency contacts.',
      'Report analysis: upload a PDF or an image and get a plain-language explanation, the values that need attention and questions to ask a doctor.',
    ],
    why: 'Health is where a confident wrong answer does real damage. The system is built to explain and to escalate, never to diagnose.',
    results: [
      { value: '8', label: 'context-aware agents in one system' },
      { value: '36 h', label: 'built overnight at a live hackathon' },
      { value: '26', label: 'API routes behind the app' },
      { value: '127', label: 'commits over one weekend' },
    ],
    topics: ['Next.js 15', 'TypeScript', 'GPT-4.1 + RAG', 'AI Agents', 'PostgreSQL', 'Prisma', 'NextAuth', 'Tailwind CSS', 'Vercel'],
    links: {
      repo: 'https://github.com/Atharv-tw/Health-companion',
      live: 'https://health-companion-navy.vercel.app',
      caseStudy: '',
    },
    media: { youtube: 'XeYYUFI3iCk' },
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
    summary:
      'A mobile game that teaches 15 to 18 year olds to budget, save and invest by playing through the decisions instead of reading about them.',
    overview: [
      'Most teenagers meet money management only after their first salary, when mistakes cost real money, and there is nowhere to practise financial decisions without the risk.',
      'Finstar turns it into play: short lessons, four games built on real-life money scenarios, and streaks, badges, friends and leaderboards to keep them coming back.',
    ],
    built: [
      'Four games in Flutter (Life Swipe, Budget Blitz, Market Explorer and Quiz Battle) with emotion-aware scoring wired into the learning path.',
      'Server-side game logic on Supabase Edge Functions: score validation and anti-cheat, XP, coins and levels, achievements, leaderboards, daily challenges and streak resets.',
      'Firebase backend: Firestore for data, Realtime Database for multiplayer quiz matchmaking, and sign-in with Google or email.',
      'AI-backed market simulation that reacts like a real (chaotic) market.',
    ],
    why: 'India has about 150 million teenagers, and financial literacy sits near 27%. Finstar gives them a place to make money mistakes before the mistakes are real.',
    results: [
      { value: '100+', label: 'positive reviews from real users' },
      { value: '4', label: 'games on budgeting, saving and investing' },
      { value: '13', label: 'edge functions running the game logic server-side' },
    ],
    topics: ['Flutter', 'Dart', 'Riverpod', 'Firebase', 'Supabase Edge Functions', 'Rive'],
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
  /** small line under the company: its site, or what the organisation is */
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
    id: 'aairo',
    company: 'AAIRO',
    site: 'AI & Robotics Society of ADGIPS',
    title: 'Computational Intelligence Lead',
    period: 'Sep 2026 — Present',
    location: 'ADGIPS',
    current: true,
    bullets: [
      'Cover the AI, ML and data science domains across the society.',
      'Lead the AI/ML integration of the society’s robotics projects.',
    ],
    tech: ['AI', 'ML', 'Data Science', 'Robotics'],
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
