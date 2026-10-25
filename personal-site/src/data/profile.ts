// Everything about Siddarth that is not a project lives here.
// Placeholders that still need real content are marked `TODO` (see PLACEHOLDERS.md).

export const profile = {
  name: 'Siddarth Oruganti',
  shortName: 'Siddarth',
  initials: 'SO',
  partNumber: 'SO-26',
  revision: '2026.10',
  role: 'Engineer, researcher, designer',
  location: 'London, UK',
  site: 'https://siddarth-oruganti.vercel.app',
  // Public, professional address (already published in the "Per the Spec" repository).
  email: 'siddarth.oruganti26@imperial.ac.uk',
  links: {
    github: 'https://github.com/Sidi3355',
    linkedin: 'https://www.linkedin.com/in/siddarth-oruganti',
  },
  // TODO: replace with a real headshot at public/images/headshot.jpg and set this to its path.
  headshot: null as string | null,
  lede:
    'First-year Electronic & Information Engineering student at Imperial. I take neural networks apart to find out what they actually learned, and build the rest: market makers, native apps, computer-vision rigs and the occasional exoskeleton.',
  description:
    'Siddarth Oruganti: Electronic & Information Engineering at Imperial College London. Interpretability and AI-evaluation research, quant backtests, native and web apps, embedded vision and wearable hardware.',
  status: [
    { key: 'Now', value: 'Auditing neural gravity-wave models' },
    { key: 'Studying', value: 'BEng EIE, Imperial College London' },
    { key: 'Reading', value: 'Gödel, Escher, Bach (Hofstadter)' },
    // TODO: confirm what you are open to, or remove this line.
    { key: 'Open to', value: 'Research & engineering internships' },
  ],
};

/** The tongue-in-cheek datasheet blurb, then the plain-English version. */
export const about = {
  datasheet:
    'The SO-26 is a general-purpose engineer optimised for problems where machine learning meets hardware and markets. It integrates a research core (interpretability, AI evaluation), a quantitative co-processor (market making, backtesting) and a full-stack build unit (web, native Windows, embedded Linux, microcontrollers). Currently in fabrication at Imperial College London, Electronic & Information Engineering, class of 2029.',
  plain: [
    'I like finding out whether a system really does what we think it does. That question runs through my research: a pre-registered audit showing that a celebrated climate-model emulator leans on where it is on the map more than on wave physics, and a 667-trial study of how AI coding agents explain themselves when they quietly game their tests.',
    'Most weeks I am building something end to end. That has meant a market maker backtested on 616k Kalshi trade prints, a native Windows tool that explains any highlighted text in under a breath, a Raspberry Pi vision system that set up my school’s laser cutter 15× faster, a 3D atlas of all 139,255 neurons in a fruit fly’s brain, and a knee exoskeleton for athletes recovering from ACL injuries.',
    'I studied Product Design alongside Maths, Further Maths and Physics, and it shows: I care about how things look and feel as much as whether they work. This site is a datasheet because that is the most honest format I know for describing a component.',
  ],
};

/** "Absolute maximum ratings": headline numbers, all traceable to a project below. */
export const ratings = [
  { symbol: 'N_neur', parameter: 'Neurons rendered in one browser tab', value: '139,255', unit: '', ref: 'neuronaut' },
  { symbol: 'T_agent', parameter: 'Agent trials run under pre-registration', value: '667', unit: '', ref: 'per-the-spec' },
  { symbol: 'H_max', parameter: 'Hypotheses screened in one audit', value: '30', unit: '', ref: 'skill-without-physics' },
  { symbol: 'P_tr', parameter: 'Trade prints analysed', value: '616k', unit: '', ref: 'kalshi-market-making' },
  { symbol: 't_cap', parameter: 'On-screen capture budget', value: '250', unit: 'ms', ref: 'saurus' },
  { symbol: 'k_setup', parameter: 'Laser-cutter setup speed-up', value: '15', unit: '×', ref: 'laser-cutter-vision' },
];

export type PinGroup = 'lang' | 'data' | 'ml' | 'build' | 'hw' | 'power';

export interface Pin {
  n: number;
  id: string;
  label: string;
  name: string;
  group: PinGroup;
  note: string;
}

/**
 * A 32-pin DIP. Pins 1–16 run down the left side, 17–32 run up the right side,
 * so pin 32 sits top right and pin 16 bottom left, as on a real package.
 */
export const pins: Pin[] = [
  { n: 1, id: 'py', label: 'PY', name: 'Python', group: 'lang', note: 'Primary language: research pipelines, backtests, services, solvers.' },
  { n: 2, id: 'ts', label: 'TS', name: 'TypeScript', group: 'lang', note: 'Typed front ends and build tooling (React, Vite, Astro).' },
  { n: 3, id: 'js', label: 'JS', name: 'JavaScript', group: 'lang', note: 'No-build-step sites, data pipelines in Node, WebGL.' },
  { n: 4, id: 'cs', label: 'C#', name: 'C# / .NET', group: 'lang', note: '.NET 10 desktop apps with Win32 interop.' },
  { n: 5, id: 'cpp', label: 'C++', name: 'C++ (Arduino)', group: 'lang', note: 'Firmware for sensing and control loops.' },
  { n: 6, id: 'c', label: 'C', name: 'C', group: 'lang', note: 'Systems fundamentals (CS50).' },
  { n: 7, id: 'sql', label: 'SQL', name: 'SQL', group: 'lang', note: 'SQLite ledgers and caches, Postgres with row-level security.' },
  { n: 8, id: 'lean', label: 'LEAN', name: 'Lean 4', group: 'lang', note: 'Machine-checked proofs of puzzle results.' },
  { n: 9, id: 'tex', label: 'TEX', name: 'LaTeX', group: 'lang', note: 'Papers in ICLR, ICML and NeurIPS formats.' },
  { n: 10, id: 'np', label: 'NP', name: 'NumPy / SciPy', group: 'data', note: 'Numerics, hand-written inference kernels, simulation.' },
  { n: 11, id: 'pl', label: 'PL', name: 'Polars', group: 'data', note: 'Fast dataframes for tick data and backtests.' },
  { n: 12, id: 'pd', label: 'PD', name: 'pandas / scikit-learn', group: 'data', note: 'Feature engineering, clustering, classic ML.' },
  { n: 13, id: 'stat', label: 'STAT', name: 'Experimental design', group: 'data', note: 'Pre-registration, controls, held-out confirmation, honest kill criteria.' },
  { n: 14, id: 'sig', label: 'SIG', name: 'Signal processing', group: 'data', note: 'FFTs, filtering and gait signals from noisy sensors.' },
  { n: 15, id: 'viz', label: 'VIZ', name: 'Plotly / d3', group: 'data', note: 'Interactive figures and dashboards.' },
  { n: 16, id: 'gnd', label: 'GND', name: 'Ground: honest caveats', group: 'power', note: 'Every project ships with its limitations written down. Keeps the whole circuit referenced to reality.' },
  { n: 17, id: 'torch', label: 'TORCH', name: 'PyTorch', group: 'ml', note: 'Training, probing and ablating models.' },
  { n: 18, id: 'onnx', label: 'ONNX', name: 'ONNX Runtime', group: 'ml', note: 'Latency-budgeted CPU inference.' },
  { n: 19, id: 'hf', label: 'HF', name: 'Hugging Face', group: 'ml', note: 'Transformers checkpoints, weight surgery.' },
  { n: 20, id: 'interp', label: 'INTP', name: 'Interpretability', group: 'ml', note: 'Linear probes, activation patching, ablations, TransformerLens (ARENA).' },
  { n: 21, id: 'cv', label: 'CV', name: 'Computer vision', group: 'ml', note: 'YOLOv8, OpenCV, MediaPipe pose.' },
  { n: 22, id: 'llm', label: 'LLM', name: 'Claude API & agents', group: 'ml', note: 'Locked-down extraction calls, streaming, multi-agent research systems in Claude Code.' },
  { n: 23, id: 'mcp', label: 'MCP', name: 'Model Context Protocol', group: 'ml', note: 'Custom tool servers for agent harnesses.' },
  { n: 24, id: 'react', label: 'RCT', name: 'React', group: 'build', note: 'Product front ends with Vite and Tailwind.' },
  { n: 25, id: '3d', label: '3D', name: 'three.js / R3F', group: 'build', note: 'Real-time 3D in the browser.' },
  { n: 26, id: 'supa', label: 'SUPA', name: 'Supabase', group: 'build', note: 'Auth, Postgres, row-level security tested against a real database.' },
  { n: 27, id: 'win', label: 'WIN', name: 'WPF / Win32', group: 'build', note: 'Low-level input hooks, UI Automation, DPAPI, layered windows.' },
  { n: 28, id: 'test', label: 'TEST', name: 'Testing & CI', group: 'build', note: 'Playwright, Lighthouse budgets, pytest, GitHub Actions.' },
  { n: 29, id: 'pi', label: 'PI', name: 'Raspberry Pi / Linux', group: 'hw', note: 'Always-on services with Docker and systemd, edge inference.' },
  { n: 30, id: 'ard', label: 'ARD', name: 'Arduino / embedded', group: 'hw', note: 'Sensors, telemetry, PID control.' },
  { n: 31, id: 'cad', label: 'CAD', name: 'SolidWorks / product design', group: 'hw', note: 'From sketch to manufacturable part; A* Product Design.' },
  { n: 32, id: 'vcc', label: 'VCC', name: 'Supply: curiosity', group: 'power', note: 'Powers everything else. Tolerates very high input.' },
];

export type LogKind = 'edu' | 'work' | 'research' | 'award' | 'build';

export interface LogEntry {
  rev: string;
  date: string;
  kind: LogKind;
  title: string;
  org?: string;
  body: string;
  bullets?: string[];
  ref?: string; // project slug
}

/** "Revision history": everything, newest first. */
export const revisions: LogEntry[] = [
  {
    rev: '2026.10',
    date: 'Oct 2026',
    kind: 'build',
    title: 'Neuronaut',
    body: 'Shipped a 3D voyage through the full FlyWire connectome of a fruit fly brain.',
    ref: 'neuronaut',
  },
  {
    rev: '2026.09',
    date: 'Sep 2026 – Jun 2029',
    kind: 'edu',
    title: 'BEng Electronic & Information Engineering',
    org: 'Imperial College London',
    body: 'Started the degree. Electronics, computing and signals, with as much machine learning as the timetable allows.',
  },
  {
    rev: '2026.09',
    date: 'Sep 2026',
    kind: 'research',
    title: 'Per the Spec (working paper)',
    body: 'Lead author of a pre-registered study of how coding agents report gaming their tests: 6 Claude models, 24 tasks, 667 trials.',
    ref: 'per-the-spec',
  },
  {
    rev: '2026.09',
    date: 'Sep 2026',
    kind: 'build',
    title: 'Wunder Fund: Alfa Connectome',
    body: 'Competition entry: a latency-budgeted GRU forecasting order-book signals, 0.648 on the public leaderboard.',
    ref: 'wunder-connectome',
  },
  {
    rev: '2026.08',
    date: 'Aug 2026 – present',
    kind: 'research',
    title: 'Independent research: mechanistic interpretability of gravity-wave parameterisations',
    body: 'Built a multi-agent research system in Claude Code auditing three neural climate models from Gupta et al. (2025).',
    bullets: [
      'Designed a hypothesis funnel: 30 hypotheses across 25 experiments, down to one measured finding.',
      'Ran causal interpretability experiments: ablations, activation probes and input-perturbation tests.',
      'Wrote it up as the paper draft “Skill Without Physics”.',
    ],
    ref: 'skill-without-physics',
  },
  {
    rev: '2026.08',
    date: 'Aug 2026',
    kind: 'build',
    title: 'RunHack: FormTwin',
    body: 'Built a running-form analysis app at the RunHack hackathon: on-device pose estimation, seven research-grounded signals, a 3D movement twin.',
    ref: 'formtwin',
  },
  {
    rev: '2026.07',
    date: 'Jul 2026',
    kind: 'award',
    title: 'Y Combinator AI Startup School',
    org: 'San Francisco',
    body: 'Selected to attend (under 5% of 30,000 applicants): talks and workshops with founders and researchers on building AI-first companies.',
  },
  {
    rev: '2026.07',
    date: 'Jul 2026',
    kind: 'build',
    title: 'Saurus',
    body: 'Built and shipped a native Windows tool that explains any highlighted on-screen text through the Claude API.',
    ref: 'saurus',
  },
  {
    rev: '2026.06',
    date: 'Jun 2026',
    kind: 'award',
    title: 'Valediction Award for Product Design',
    org: 'Queen Elizabeth’s School',
    body: 'The school’s leaving prize for Product Design, awarded to one student in a cohort of about 180.',
  },
  {
    rev: '2025.12',
    date: 'Dec 2025 – Mar 2026',
    kind: 'work',
    title: 'Laser Cutter Technician',
    org: 'QE Product Design Department',
    body: 'Built a real-time computer-vision system that identifies laser-cutter materials and applies the right cutting presets.',
    bullets: [
      'Fine-tuned YOLOv8n on a self-collected dataset of 700+ images; 92% accuracy on a Raspberry Pi.',
      'Cut machine setup from 5 minutes to 20 seconds (15×) by auto-applying presets from a SQLite database.',
    ],
    ref: 'laser-cutter-vision',
  },
  {
    rev: '2025.08',
    date: 'Aug 2025',
    kind: 'work',
    title: 'Quantitative Research Work Experience',
    org: 'G-Research',
    body: 'Selected for the pre-university quant research placement (under 1.8% acceptance). Python, Polars, NumPy, Plotly.',
    bullets: [
      'Grew a simulated $100k portfolio to $7.7M trading AMD over 10 years: 54% annualised, net of fees.',
      'Backtested momentum and 5/20-day moving-average crossover strategies with dynamic capital allocation and transaction costs.',
      'Evaluated with Sharpe ratio, a buy-and-hold benchmark, and MSE against a persistence baseline.',
    ],
  },
  {
    rev: '2025',
    date: '2025',
    kind: 'award',
    title: 'Big Bang Competition: IHEEM Special Award, Highly Commended',
    org: 'Institute of Healthcare Engineering & Estate Management',
    body: 'For AthlExo, an AI-assisted knee exoskeleton for sports-injury rehabilitation.',
    ref: 'athlexo',
  },
  {
    rev: '2025.04',
    date: 'Apr 2025',
    kind: 'award',
    title: 'Minds Underground Essay Competition: High Commendation',
    body: 'Highly commended in the 2025 essay competitions.',
  },
  {
    rev: '2025.01',
    date: 'Jan 2025',
    kind: 'build',
    title: 'Fantasy Premier League points predictor',
    body: 'A residual network that finished in the 84th percentile of its leaderboard.',
    ref: 'fpl-predictor',
  },
  {
    rev: '2024.09',
    date: 'Sep 2024 – Sep 2025',
    kind: 'research',
    title: 'Extended Project Qualification (A*)',
    body: 'A sub-500 g, under-£150 knee exoskeleton for ACL and meniscus rehabilitation, with gait sensing and an LSTM recovery score.',
    ref: 'athlexo',
  },
  {
    rev: '2024.04',
    date: 'Apr 2024',
    kind: 'award',
    title: 'UK Olympiad in Artificial Intelligence: Bronze',
    body: 'Machine learning, neural networks and AI theory.',
  },
  {
    rev: '2022',
    date: '2022',
    kind: 'build',
    title: 'Greenpower F24 race car',
    org: 'QE GreenPower Team',
    body: 'Led the design of the school’s car for the national electric-car competition, and added Arduino telemetry.',
    ref: 'greenpower',
  },
  {
    rev: '2019.09',
    date: 'Sep 2019 – Jun 2026',
    kind: 'edu',
    title: 'Queen Elizabeth’s School',
    org: 'London',
    body: 'A levels: Mathematics, Further Mathematics, Physics, Product Design and the EPQ, all A*. GCSEs: ten grade 9s plus an A*.',
  },
];

/** "Electrical characteristics": education and grades, as a parameter table. */
export const characteristics = [
  { parameter: 'Degree', condition: 'Imperial College London · 2026–2029', min: '', typ: 'BEng', max: '', note: 'Electronic & Information Engineering' },
  { parameter: 'A level: Mathematics', condition: 'QE School · 2026', min: 'A*', typ: 'A*', max: 'A*', note: '' },
  { parameter: 'A level: Further Mathematics', condition: 'QE School · 2026', min: 'A*', typ: 'A*', max: 'A*', note: '' },
  { parameter: 'A level: Physics', condition: 'QE School · 2026', min: 'A*', typ: 'A*', max: 'A*', note: '' },
  { parameter: 'A level: Product Design', condition: 'QE School · 2026', min: 'A*', typ: 'A*', max: 'A*', note: 'Valediction Award' },
  { parameter: 'EPQ', condition: 'Knee exoskeleton · 2025', min: 'A*', typ: 'A*', max: 'A*', note: 'Report linked below' },
  { parameter: 'GCSEs', condition: '11 subjects', min: '9', typ: '9', max: '9', note: 'Ten grade 9s + A*' },
];

export const awards = [
  { year: '2026', name: 'Y Combinator AI Startup School', detail: '<5% of 30,000 applicants' },
  { year: '2026', name: 'QE Valediction Award, Product Design', detail: '1 of ~180' },
  { year: '2025', name: 'G-Research Quant Research Work Experience', detail: '<1.8% acceptance' },
  { year: '2025', name: 'Big Bang Competition: IHEEM Special Award', detail: 'Highly Commended' },
  { year: '2025', name: 'Minds Underground Essay Competition', detail: 'High Commendation' },
  { year: '2024', name: 'UK Olympiad in Artificial Intelligence', detail: 'Bronze' },
];

/** Self-directed study, mostly in public at github.com/Sidi3355/Tutorials. */
export const learning = [
  { name: 'ARENA', detail: 'AI-safety curriculum: GPT-2 from scratch in PyTorch, mechanistic interpretability with TransformerLens.' },
  { name: 'Neural Networks: Zero to Hero', detail: 'Karpathy’s course; micrograd and its exercises.' },
  { name: 'CS50', detail: 'Harvard’s intro to computer science, in C.' },
];
