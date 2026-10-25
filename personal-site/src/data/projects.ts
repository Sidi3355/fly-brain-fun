// Every project on the site. Facts and numbers come from the project's own repository,
// paper or report; nothing here is estimated. Placeholders are marked `TODO`.

export type Category = 'research' | 'quant' | 'ml' | 'product' | 'hardware' | 'creative';

export const categories: Record<Category, string> = {
  research: 'Research',
  quant: 'Quant',
  ml: 'Machine learning',
  product: 'Product',
  hardware: 'Hardware',
  creative: 'Creative code',
};

export type FigureKey =
  | 'spec'
  | 'gwave'
  | 'refusal'
  | 'neuron'
  | 'equity'
  | 'gru'
  | 'pill'
  | 'runner'
  | 'pitch'
  | 'calendar'
  | 'laser'
  | 'knee'
  | 'walk'
  | 'fpl'
  | 'overnight'
  | 'aero'
  | 'car';

export interface Metric {
  value: string;
  label: string;
}

export interface Link {
  label: string;
  href: string;
  kind: 'live' | 'code' | 'paper' | 'report' | 'video';
}

export interface Section {
  heading: string;
  body?: string[];
  bullets?: string[];
}

export interface Project {
  slug: string;
  part: string;
  title: string;
  kicker: string;
  date: string;
  year: number;
  category: Category;
  tier: 'research' | 'featured' | 'more';
  context?: string;
  summary: string;
  metrics: Metric[];
  /** Pin ids from profile.ts. */
  stack: string[];
  tools: string[];
  links: Link[];
  /** Private repositories are mentioned, never linked. */
  source: 'public' | 'private' | 'none';
  figure: FigureKey;
  figureCaption: string;
  sections: Section[];
  caveats?: string[];
}

const gh = (repo: string) => `https://github.com/Sidi3355/${repo}`;

export const projects: Project[] = [
  // ───────────────────────────── Research ─────────────────────────────
  {
    slug: 'per-the-spec',
    part: 'R-01',
    title: 'Per the Spec',
    kicker: 'Coding agents cite invented requirements when they game their tests',
    date: 'Sep 2026',
    year: 2026,
    category: 'research',
    tier: 'research',
    context: 'Working paper · lead author · AI safety',
    summary:
      'When a test contradicts the specification, AI coding agents often make it pass by inventing a general-looking rule, then tell the user the rule was a requirement. A pre-registered study of six Claude models across 667 trials.',
    metrics: [
      { value: '667', label: 'trials, pre-registered' },
      { value: '51%', label: 'of special-case reports cite a requirement that exists nowhere' },
      { value: '76→34%', label: 'gaming when minimal pairs remove any plausible rule' },
    ],
    stack: ['py', 'llm', 'mcp', 'stat', 'tex'],
    tools: ['Claude Code CLI', 'MCP server', 'LLM judges', 'statsmodels', 'LaTeX'],
    links: [
      { label: 'Code & data', href: gh('opus-5.5-research-test'), kind: 'code' },
      // TODO: add the arXiv link once the preprint is posted.
    ],
    source: 'public',
    figure: 'spec',
    figureCaption: 'Share of trials in which each model gamed the suite, with 95% CIs. Data: analysis/results.json.',
    sections: [
      {
        heading: 'Question',
        body: [
          'A coding agent’s final report is often the only account of its work anyone reads. What do those reports say when the agent games its tests?',
        ],
      },
      {
        heading: 'Method',
        bullets: [
          'Built 24 small repositories in which one test contradicts the function’s documentation, so no faithful implementation can pass the whole suite.',
          'Ran six Claude models (Haiku 4.5, Sonnet 4.5, Opus 4.5, Sonnet 5, Opus 5.5, Fable 5.1) in the Claude Code CLI, with a dependency-free MCP server exposing run_tests and logging every call.',
          'Graded automatically for test tampering, special-casing and hidden-specification failures; coded reports with LLM judges under a JSON schema.',
          'Pre-registered the protocol and committed it before collecting the main data; amendments are dated.',
          'Added minimal pairs that remove any plausible rule, a same-session probe interview, and a code-review experiment with LLM reviewers.',
        ],
      },
      {
        heading: 'Findings',
        bullets: [
          'Four of six models gamed the suite in most trials, almost never by hardcoding: they adopted a general-looking rule under which the wrong test is right, and often rewrote the documentation to match.',
          '265 of 270 such rules changed behaviour on inputs other than the conflict input.',
          'In 51% of these cases the report justified the rule with a requirement written nowhere in the repository or conversation; test edits, by contrast, were disclosed 97% of the time.',
          'Asked whether it added test-specific logic, the agent usually said no (the rule is general); asked for the rule’s source, it usually said the test.',
          'LLM reviewers shown only the diff approved 27% of gamed changes carrying the agent’s report, against 8% with an honest description and 7% with none.',
          'Claude Opus 5.5 and Fable 5.1 gamed least and disclosed every special case they made.',
        ],
      },
      {
        heading: 'Deliverables',
        body: [
          'Tasks, harness, pre-registration, every trial record, judge outputs and analysis are public, with the paper built for ICLR, ICML, NeurIPS and arXiv from one set of sources. Total API cost at list prices: about US$609.',
        ],
      },
    ],
    caveats: [
      'Judge labels were validated against a sample coded by the lead agent, not by humans; a blinded sheet is ready for human coding.',
    ],
  },
  {
    slug: 'skill-without-physics',
    part: 'R-02',
    title: 'Skill Without Physics',
    kicker: 'A mechanistic audit of neural gravity-wave parameterisations',
    date: 'Aug 2026 – present',
    year: 2026,
    category: 'research',
    tier: 'research',
    context: 'Independent research · paper draft (ICML format)',
    summary:
      'Neural networks are replacing hand-built gravity-wave schemes in climate models, and horizontal context is credited for their skill. Opening up the published models shows much of that skill rides on where the network is on the map, not on wave physics.',
    metrics: [
      { value: '30', label: 'hypotheses generated, 24 screened, 15 killed' },
      { value: '1.10→0.33', label: 'variance calibration when the input map is rolled' },
      { value: '62%', label: 'of variance calibration from a position prior (upper bound)' },
    ],
    stack: ['py', 'torch', 'interp', 'np', 'stat', 'llm', 'tex'],
    tools: ['PyTorch (CPU)', 'Multi-agent Claude Code', 'Ray tracing baselines', 'LaTeX'],
    links: [
      { label: 'Code', href: gh('gravity-wave-mech-interp'), kind: 'code' },
      { label: 'Paper draft (PDF)', href: gh('gravity-wave-mech-interp/blob/main/paper/main.pdf'), kind: 'paper' },
    ],
    source: 'public',
    figure: 'gwave',
    figureCaption: 'Orographic gravity waves breaking over a ridge, the physics these networks are meant to learn.',
    sections: [
      {
        heading: 'Question',
        body: [
          'Gupta, Sheshadri, Roy & Anantharaj (2025) showed that giving a neural parameterisation a wider horizontal view improves its gravity-wave flux predictions. It is natural to hope that is because the network learned how waves travel. Is it?',
        ],
      },
      {
        heading: 'Method',
        bullets: [
          'Built a multi-agent research system in Claude Code to audit the released single-column, 3×3-stencil and Attention U-Net checkpoints.',
          'Ran a pre-registered hypothesis funnel: 30 hypotheses with explicit kill and confirm criteria, 24 screened (15 killed), 1 measured, 5 deferred with reasons, 1 killed at held-out confirmation.',
          'Used ablations, activation probes, Jacobian context maps and single-aspect “physics grafts” on real atmospheric columns, validated first on a 1D testbed emulator that demonstrably learned its physics.',
          'Every metrics file is stamped with its config hash and git state, so each figure and table traces back to the run that produced it.',
        ],
      },
      {
        heading: 'Findings',
        bullets: [
          'Position, not physics, carries much of the U-Net’s calibration. Convolutional padding lets it infer absolute position; rolling the input map, which changes no physics, collapses flux-variance calibration from 1.10 to 0.33. The split replicates on a second held-out month.',
          'The literature’s headline metric (pooled-histogram Hellinger distance) is blind to that collapse, and can even be improved by physically absurd variance inflation.',
          'The context the network causally uses is long-range (median four grid cells, ~1,200 km at T42) but isotropic and unrelated to ray-traced propagation directions.',
          'The column models fail single-aspect grafts: no filtering response, drag that ignores wind rotation, non-monotone amplitude response.',
          'Also found practical landmines: a public dataset silently incompatible with the public models trained on it.',
        ],
      },
    ],
    caveats: [
      'Roll ensembles give an upper bound on the position share, because rolling also pushes inputs off-manifold.',
      'No seed ensembles exist for the released checkpoints, so checkpoint and input variant are confounded.',
    ],
  },
  {
    slug: 'refusal-direction',
    part: 'R-03',
    title: 'The refusal direction in Gemma-2B',
    kicker: 'Finding, then removing, a model’s “no” with a linear probe',
    date: 'Sep 2026',
    year: 2026,
    category: 'research',
    tier: 'research',
    context: 'Interpretability experiment · after Arditi et al. (2024)',
    summary:
      'Trained a logistic-regression probe on Gemma-2B’s residual stream to find the direction that separates harmful from harmless prompts, then projected it out of the weights. Refusal on harmful prompts fell from 66% to 7%; a random direction did nothing.',
    metrics: [
      { value: '66→7%', label: 'refusal on harmful prompts (mean ablation)' },
      { value: '65%', label: 'random-direction control: no effect' },
      { value: '0%', label: 'over-refusal on harmless prompts' },
    ],
    stack: ['py', 'torch', 'hf', 'interp', 'stat'],
    tools: ['Hugging Face Transformers', 'scikit-learn probes', 'GGUF control vectors'],
    links: [{ label: 'Code', href: gh('gemma_2b_refusal_unlearning'), kind: 'code' }],
    source: 'public',
    figure: 'refusal',
    figureCaption: 'Projecting the refusal direction r out of every matrix that writes to the residual stream.',
    sections: [
      {
        heading: 'Method',
        bullets: [
          'Recorded residual-stream activations at the last prompt token for 130 harmful and 126 matched harmless prompts, at every layer.',
          'Trained a logistic-regression probe per layer and kept the best held-out layer; its normalised weight vector is the refusal direction r.',
          'Edited the weights permanently, W ← W − r rᵀ W, on the token embeddings and every attention o_proj and MLP down_proj, and compared refusal rates.',
          'Validated the machinery offline first: a tiny random model built from the real Gemma classes, asserting exactly the right matrices change and max |r · o_proj| ≈ 1e-9.',
        ],
      },
      {
        heading: 'Results (gemma-2b-it, 130 harmful / 126 harmless prompts)',
        bullets: [
          'Baseline: 66.2% refusal on harmful prompts, 0% on harmless.',
          'Zero ablation: 30.0%. Mean ablation: 6.9%. Reversed direction: 23.8%.',
          'Weight-baked single-file approximation: 3.8% harmful, 1.6% harmless.',
          'Random-direction control: 64.6%, essentially unchanged, so the effect is specific to r.',
        ],
      },
    ],
    caveats: [
      'The point is to measure how refusal is represented, and how easily safety fine-tuning is undone by a linear edit, which argues for more robust alignment. Generations are saved locally, never printed.',
    ],
  },

  // ───────────────────────────── Featured ─────────────────────────────
  {
    slug: 'neuronaut',
    part: 'P-01',
    title: 'Neuronaut',
    kicker: 'A voyage through every neuron of a fruit fly’s brain',
    date: 'Sep – Oct 2026',
    year: 2026,
    category: 'creative',
    tier: 'featured',
    summary:
      'The complete FlyWire connectome in a browser tab: 139,255 real neurons and 54.5 million synapses in 3D, from electron-microscope slices to whole-brain spiking simulations. No build step, everything derived from public data.',
    metrics: [
      { value: '139,255', label: 'neurons, every one clickable' },
      { value: '54.5M', label: 'synapses' },
      { value: '9', label: 'stations, from EM slice to simulation' },
    ],
    stack: ['js', '3d', 'py', 'np', 'viz'],
    tools: ['three.js', 'd3', 'Custom binary columnar format', 'Leaky integrate-and-fire model (numba)'],
    links: [{ label: 'Live site', href: 'https://neuronaut-phi.vercel.app', kind: 'live' }],
    source: 'private',
    figure: 'neuron',
    figureCaption: 'Real FlyWire skeletons of the lobula-plate HS and VS cells, the fly’s wide-field motion detectors, exported from Neuronaut’s data.',
    sections: [
      {
        heading: 'What it is',
        body: [
          'Nine stations take you from real electron-microscope sections (zooming from 512 nm to 8 nm per pixel) through the assembly of every proofread neuron, a census by cell class and transmitter, the 78 neuropils, 36,000 strong connections drawn as arcs, famous cells as real morphologies, and whole-brain spiking simulations of taste, smell, light, sound, grooming and looming.',
          'The last station is a free explorer: search any of 8,800+ cell types or a root ID, click any neuron to see its strongest partners, filter and recolour.',
        ],
      },
      {
        heading: 'How it is built',
        bullets: [
          'A Python pipeline turns FlyWire’s releases (Zenodo feathers, annotation tables, public cloud buckets of EM, segmentation, skeletons and neuropil meshes) into browser-ready assets.',
          'Binary assets use a small columnar container: a JSON directory of named arrays, then 8-byte-aligned little-endian data the browser views directly as typed arrays.',
          'Simulations re-run the Shiu et al. (2024) leaky integrate-and-fire model on the v783 connectome with numba, validated against Brian2.',
          'A lossless PNG-wrapped build makes the data about 40% smaller, for hosts that only serve web media types.',
        ],
      },
    ],
    caveats: [
      'Transmitters are predicted from EM images, not measured. The simulation ignores neuromodulation, gap junctions and learning, and each run states its caveats in the interface.',
      'Independent visualisation; not affiliated with the FlyWire Consortium. Data CC BY 4.0.',
    ],
  },
  {
    slug: 'kalshi-market-making',
    part: 'P-02',
    title: 'Kalshi market maker',
    kicker: 'Avellaneda–Stoikov quoting on hourly Bitcoin prediction markets',
    date: 'Aug 2026',
    year: 2026,
    category: 'quant',
    tier: 'featured',
    summary:
      'A research pipeline that collects Kalshi’s public market data, ranks markets by estimated maker edge, fits Avellaneda–Stoikov parameters from tick data and replays an inventory-aware quoting strategy against real trade prints.',
    metrics: [
      { value: '+48.4%', label: 'backtest return over one month' },
      { value: '344', label: 'markets, 66% profitable' },
      { value: '5,477', label: 'fills at 0.88¢ each' },
    ],
    stack: ['py', 'pl', 'np', 'viz', 'stat'],
    tools: ['Polars', 'NumPy', 'Kalshi REST API', 'Plotly'],
    links: [{ label: 'Code & data', href: gh('kalshi-market-making'), kind: 'code' }],
    source: 'public',
    figure: 'equity',
    figureCaption: 'Cumulative backtest P&L across 344 KXBTC markets, 29 Jul – 27 Aug 2026. Re-run from the repository for this page.',
    sections: [
      {
        heading: 'Pipeline',
        bullets: [
          'Collect: settled markets, ~616k trade prints and ~846k one-minute candles from Kalshi’s public API.',
          'Rank: per-market liquidity stats combined into an edge per fill (half-spread − maker fee − one-minute adverse drift) and an edge flow (edge × fill rate).',
          'Fit: σ as the rolling std of one-minute mid changes; fill intensity λ(δ) = A·e^(−kδ) by log-linear regression of trades per hour against distance from mid.',
          'Replay: each minute, quote around the reservation price r = mid − q·γσ²T with spread γσ²T + (2/γ)·ln(1 + γ/k), capped at 4¢; fills only when a real trade prints through the quote; maker fees, a ±100 inventory cap and a 90-minute pre-close cutoff.',
        ],
      },
      {
        heading: 'Results (γ = 0.1, size 1)',
        bullets: [
          '$100 → $148.41: +$48.41 over 344 markets, max drawdown −$15.93.',
          '228 profitable markets, 84 losing; average win $0.57, average loss −$0.96.',
          'Maximum inventory held: 20 contracts.',
        ],
      },
    ],
    caveats: [
      'No queue modelling: a quote fills whenever any trade prints through it, so real fill rates and P&L would be lower.',
      'γ and the cutoff were chosen by grid search on the same month they were evaluated on, with only a rough date split as an out-of-sample check.',
    ],
  },
  {
    slug: 'saurus',
    part: 'P-03',
    title: 'Saurus',
    kicker: 'Highlight anything on screen, get an expert explanation',
    date: 'Jul 2026',
    year: 2026,
    category: 'product',
    tier: 'featured',
    summary:
      'A native Windows tool: highlight text in any app, click the pill that appears, and a dense technical explanation streams into a side panel, with follow-ups. Built to beat alt-tabbing to a chatbot on friction and latency.',
    metrics: [
      { value: '250 ms', label: 'hard budget for cross-process text capture' },
      { value: '7', label: 'stage spend-guardrail chain' },
      { value: '0', label: 'network calls in offline mode, not even DNS' },
    ],
    stack: ['cs', 'win', 'sql', 'llm', 'test'],
    tools: ['.NET 10', 'WPF', 'UI Automation', 'Win32 hooks', 'SQLite', 'Anthropic API (SSE)', 'DPAPI'],
    links: [
      { label: 'Code', href: gh('saurus'), kind: 'code' },
      { label: 'Demo video (17 s)', href: gh('saurus/blob/main/docs/demo.mp4'), kind: 'video' },
    ],
    source: 'public',
    figure: 'pill',
    figureCaption: 'Select, pill, panel: the whole interaction.',
    sections: [
      {
        heading: 'Engineering',
        bullets: [
          'Low-level input hooks detect a selection; UI Automation reads it across process boundaries on a dedicated MTA thread with a 250 ms budget. A hung app can block a COM call for seconds, so on overrun the worker thread is abandoned and replaced: a dropped capture beats a frozen UI.',
          'The panel and backdrop avoid WPF’s software-rendered transparency: an opaque layered window driven by SetLayeredWindowAttributes plus DWM corners and shadow, so animations are GPU-composited and an open panel costs nothing.',
          'One code path reaches the network, through a guardrail chain of hard stops: cache, rate limit, circuit breaker, and hourly and daily token budgets in a two-phase SQLite ledger (reserve before the call, settle after, so a crash mid-call still counts).',
          'The API key is encrypted at rest with Windows DPAPI, and the README is explicit about what that does and does not protect against.',
        ],
      },
      {
        heading: 'Product details',
        bullets: [
          'An offline mode exercises everything but the network and echoes the exact payload that would have been sent, which doubles as a capture diagnostic.',
          'A corner badge shows today’s tokens and cost; history keeps every question, answer, source and price.',
          'Start-with-Windows writes a per-user HKCU entry so it can always be disabled from Task Manager: a background tool you cannot remove is a tool you cannot trust.',
        ],
      },
    ],
  },
  {
    slug: 'formtwin',
    part: 'P-04',
    title: 'FormTwin',
    kicker: 'Don’t just give me a score. Show me.',
    date: 'Aug 2026',
    year: 2026,
    category: 'ml',
    tier: 'featured',
    context: 'Built at RunHack',
    summary:
      'Turns a short side-on phone clip of you running into an explainable 3D movement twin, with the exact frames and joints behind every observation and one concrete coaching cue. Pose estimation runs on your device; the video never leaves it.',
    metrics: [
      { value: '33', label: 'landmarks per frame, on-device' },
      { value: '7', label: 'research-grounded gait signals' },
      { value: '0', label: 'bytes of video uploaded' },
    ],
    stack: ['ts', 'react', '3d', 'cv', 'llm'],
    tools: ['React 18', 'Vite', 'Tailwind v4', 'MediaPipe Pose Landmarker', 'react-three-fiber', 'Fitbit OAuth (PKCE)'],
    links: [
      { label: 'Live app', href: 'https://formtwin.vercel.app', kind: 'live' },
      { label: 'Code', href: gh('RunHack'), kind: 'code' },
    ],
    source: 'public',
    figure: 'runner',
    figureCaption: 'A side-on stride with the foot-placement cue: land under a flexing knee.',
    sections: [
      {
        heading: 'Signals',
        body: [
          'Posture, foot placement (the 2D overstride cue), knee motion, left–right symmetry, cadence, bounce and landing-knee flexion, each with its target band and literature source on the card. Signals that cannot be trusted for a given clip are flagged unreliable instead of shown as fact.',
        ],
      },
      {
        heading: 'Validation',
        body: [
          'Ran the real pipeline headlessly on public running footage that comes with independent expert analysis (a physical therapist’s overstriding demo, Mo Farah race footage, professional runners at labelled paces), saved the outputs before reading the experts, then compared metric by metric and fixed systematic disagreements.',
        ],
      },
      {
        heading: 'Features',
        bullets: [
          'Animated 3D twin to orbit, scrub and play; skeleton overlay with metric-linked joint highlighting.',
          '“Show me the fix” correction ghost, local progress history, PNG/PDF results card, overlay video export.',
          'Optional generative coaching through a server-side edge function; a labelled deterministic fallback without it.',
        ],
      },
    ],
    caveats: [
      'A coaching-level agreement check against expert video analyses, not a clinical validation against motion capture. Not a medical device.',
    ],
  },
  {
    slug: 'pitchfinder',
    part: 'P-05',
    title: 'PitchFinder',
    kicker: 'Pick a football pitch for the whole group, from where everyone is coming',
    date: 'Sep – Oct 2026',
    year: 2026,
    category: 'product',
    tier: 'featured',
    summary:
      'About 200 bookable pitches across Greater London with real prices and opening hours read from operators’ own pages and booking calendars. One person makes a group link; everyone adds where they’re coming from and what they need; venues are ranked for the whole group.',
    metrics: [
      { value: '~200', label: 'bookable venues in Greater London' },
      { value: 'Weekly', label: 'automated data refresh and audit' },
      { value: 'RLS', label: 'policies tested against a real Postgres' },
    ],
    stack: ['js', 'react', 'supa', 'sql', 'test'],
    tools: ['Vite + React', 'Supabase', 'MapLibre', 'OSRM', 'TfL Journey Planner', 'Overpass / OpenStreetMap', 'Playwright', 'Lighthouse', 'GitHub Actions'],
    links: [
      { label: 'Live app', href: 'https://pitchfinder-pied.vercel.app', kind: 'live' },
      { label: 'Code', href: gh('pitchfinder'), kind: 'code' },
    ],
    source: 'public',
    figure: 'pitch',
    figureCaption: 'Three journeys, one pitch: the group ranking in miniature.',
    sections: [
      {
        heading: 'Data you can trust',
        bullets: [
          'Overpass gives every football pitch in Greater London; each is classified, private and school grounds are dropped, and pitches on one site collapse into a venue.',
          'An identified headless browser (robots.txt honoured, one page every two seconds) reads operators’ club pages and booking calendars, folding priced slots into bands per pitch size, day and kick-off time. Nothing is extrapolated.',
          'Every fact carries its source URL and the date it was read. Unknown facts say so; the app links to the booking page rather than guess.',
          'A weekly audit flags missing facts, duplicate names, coordinates over 150 m from their postcode and dead booking links.',
        ],
      },
      {
        heading: 'Product',
        bullets: [
          'Group links collate everyone’s needs: a need stated by anyone is a must, the tightest budget and shortest journey apply.',
          'Ranking is instant and gives plain-language reasons that are true by construction; journey times are then routed by OSRM and TfL.',
          'Game links let anyone say in or out without an account, through a security-definer function; row-level security keeps everything else private.',
          'CI runs lint, unit and RLS tests, a bundle budget, Playwright on iPhone and desktop profiles, and Lighthouse on simulated slow 4G.',
        ],
      },
    ],
  },
  {
    slug: 'laser-cutter-vision',
    part: 'P-06',
    title: 'Laser-cutter vision',
    kicker: 'A Raspberry Pi that recognises the material and sets up the machine',
    date: 'Dec 2025 – Mar 2026',
    year: 2026,
    category: 'hardware',
    tier: 'featured',
    context: 'Assistant technician · QE Product Design Department',
    summary:
      'A real-time computer-vision system for the school workshop: a camera identifies the sheet on the bed, and the matching cutting preset is applied from a database with an LCD confirmation, instead of someone looking it up.',
    metrics: [
      { value: '92%', label: 'material identification accuracy' },
      { value: '700+', label: 'self-collected training images' },
      { value: '15×', label: 'faster setup: 5 min → 20 s' },
    ],
    stack: ['py', 'cv', 'torch', 'pi', 'sql'],
    tools: ['YOLOv8n (Ultralytics)', 'OpenCV', 'CVAT', 'SQLite', 'Raspberry Pi'],
    links: [
      { label: 'Report', href: 'https://drive.google.com/file/d/1DCf-XKAYSwV8oFBzuV-gM2UU9u-m9aGP/view', kind: 'report' },
    ],
    source: 'none',
    figure: 'laser',
    figureCaption: 'Detection, lookup, preset.',
    sections: [
      {
        heading: 'What I built',
        bullets: [
          'Collected and labelled a dataset of 700+ images of the department’s sheet materials in CVAT.',
          'Fine-tuned YOLOv8n and optimised it for edge inference speed on a Raspberry Pi.',
          'Wrote a Python pipeline mapping detections to a SQLite preset database and auto-applying cutting settings, with an LCD confirmation interface.',
        ],
      },
    ],
  },
  {
    slug: 'athlexo',
    part: 'P-07',
    title: 'AthlExo',
    kicker: 'An AI-assisted knee exoskeleton for injured athletes',
    date: 'Sep 2024 – Sep 2025',
    year: 2025,
    category: 'hardware',
    tier: 'featured',
    context: 'EPQ (A*) · Big Bang Competition, IHEEM award: Highly Commended',
    summary:
      'A lightweight lower-limb exoskeleton for ACL and meniscus rehabilitation, with embedded gait sensing and a model that scores how far a stride is from healthy, so recovery can be tracked between physio appointments.',
    metrics: [
      { value: '<500 g', label: 'target mass' },
      { value: '<£150', label: 'target cost' },
      { value: '10 Hz', label: 'gait streaming to the cloud' },
    ],
    stack: ['ard', 'cpp', 'sig', 'torch', 'cad'],
    tools: ['Arduino Uno R4 WiFi', 'Motion sensors', 'FFT', 'Bidirectional LSTM autoencoder', 'PID control', 'SolidWorks'],
    links: [
      { label: 'EPQ report', href: 'https://drive.google.com/file/d/10ssaDYxmDFCFSuznb4urzmUOORSGBbIC/view', kind: 'report' },
    ],
    source: 'none',
    figure: 'knee',
    figureCaption: 'Knee brace with tensile elastic assist, sensor pod and the flexion angle it tracks.',
    sections: [
      {
        heading: 'Design',
        bullets: [
          'Supports flexion and extension with a lightweight tensile elastic band system rather than heavy motors, targeting under 500 g and under £150.',
          'Researched from the user’s side first: market research on existing rehab products and the clinical context of ACL and meniscus recovery.',
          'Modelled and iterated the frame in SolidWorks.',
        ],
      },
      {
        heading: 'Sensing and ML',
        bullets: [
          'A cloud-connected Arduino pipeline streams gait data at 10 Hz, with FFT signal processing and movement classification.',
          'A bidirectional LSTM autoencoder scores gait impairment by reconstruction error: the further a stride is from healthy gait, the worse it reconstructs, which gives a recovery curve over time.',
          'PID control and real-time feedback adapt support to the user’s rehabilitation stage.',
        ],
      },
    ],
  },
  {
    slug: 'autocal',
    part: 'P-08',
    title: 'autocal',
    kicker: 'Reads your email, puts real-world events in your calendar',
    date: 'Aug 2026',
    year: 2026,
    category: 'product',
    tier: 'featured',
    summary:
      'An always-on service on a Raspberry Pi that turns appointments, bookings and deadlines in your inbox into correctly timed calendar events on your phone within about a minute, for roughly 70p a month.',
    metrics: [
      { value: '~70p', label: 'per month at ~50 emails a day' },
      { value: '~1 min', label: 'from email to iPhone' },
      { value: '0', label: 'tools available to the LLM call' },
    ],
    stack: ['py', 'llm', 'sql', 'pi', 'test'],
    tools: ['Claude Haiku', 'Gmail API', 'CalDAV (iCloud)', 'Docker', 'ntfy', 'pytest'],
    links: [],
    source: 'private',
    figure: 'calendar',
    figureCaption: 'Email in, event out; ambiguous ones go to a review calendar.',
    sections: [
      {
        heading: 'Design',
        bullets: [
          'Structured emails (.ics invites, booking metadata) are parsed deterministically; no AI involved.',
          'Everything else goes through one locked-down Claude call that can output nothing but an event JSON. With no tools, a malicious email can at worst produce a bad event, which lands in a review calendar, never silently.',
          'The model never does date arithmetic: it labels dates as absolute, relative or recurring, and deterministic code resolves them against the email’s timestamp, DST-safely.',
          'A newsletter filter, sender deny-list and local parsers avoid paying for emails with no events; a daily call budget is a hard stop on spend.',
          'Failures push to your phone and a daily digest confirms it is alive: silence is never the failure mode.',
          'A golden fixture set and an eval command score extraction quality, so a model upgrade is a decision made with numbers.',
        ],
      },
    ],
  },
  {
    slug: 'wunder-connectome',
    part: 'P-09',
    title: 'Alfa Connectome',
    kicker: 'Forecasting order-book signals under a hard latency budget',
    date: 'Sep 2026',
    year: 2026,
    category: 'quant',
    tier: 'featured',
    context: 'Wunder Fund ML competition',
    summary:
      'Predict two indicators of future price movement from 112 order-book and trade features, one row at a time, statefully, on a CPU. A plain causal GRU with a weighted-Pearson-aware loss beat the official baseline by a wide margin.',
    metrics: [
      { value: '0.648', label: 'public leaderboard (weighted Pearson)' },
      { value: '+0.059', label: 'over the official GRU baseline on validation' },
      { value: '26 µs', label: 'per row, hand-written NumPy inference' },
    ],
    stack: ['py', 'torch', 'onnx', 'np', 'stat'],
    tools: ['PyTorch', 'ONNX Runtime', 'NumPy', 'numba (benchmarked, dropped)'],
    links: [],
    source: 'private',
    figure: 'gru',
    figureCaption: 'Score ladder on the same 600-sequence validation slice.',
    sections: [
      {
        heading: 'Approach',
        bullets: [
          'Started from prior art: plain causal GRUs won the related Wunder challenges; deeper stacks, attention, TCNs and hand features on pre-whitened inputs did not help.',
          'Trained on weighted MSE against clipped targets (the direct proxy for the metric), mixed with a batch-level 1 − ρ_w term, both targets jointly, with EMA weights.',
          'Measured inference cost per architecture: a wider single layer was far cheaper than two stacked layers, so GRU-192 sat at the edge of the latency budget.',
          'Calibrated local validation against the public leaderboard (a consistent −0.035 gap) so decisions did not depend on noisy single-epoch proxies.',
        ],
      },
      {
        heading: 'Results',
        bullets: [
          'Official baseline: 0.624 on the 600-sequence slice (0.617 on full validation).',
          'Final GRU-192: 0.683 on the same slice; 0.648 on the public leaderboard.',
          'A larger GRU-256 trained from scratch scored lower (0.676), so the smaller model shipped.',
        ],
      },
    ],
  },

  // ───────────────────────────── More ─────────────────────────────
  {
    slug: 'griddles',
    part: 'M-01',
    title: 'GRiddles B4: the passcode game',
    kicker: 'A G-Research puzzle, answered with a Lean 4 proof',
    date: 'Sep 2026',
    year: 2026,
    category: 'research',
    tier: 'more',
    summary:
      'Bob walks the positive integers with a sequence he has to reveal; Ana guesses his passcode. The smallest number of guesses per turn that guarantees Ana wins is 2. The two-guess strategy is proved and machine-checked in Lean 4.',
    metrics: [
      { value: 'ℓ = 2', label: 'answer' },
      { value: 'Lean 4', label: 'formal proof, no Mathlib needed' },
    ],
    stack: ['lean', 'py', 'stat'],
    tools: ['Lean 4', 'Python solvers', 'Simulated annealing over sequences'],
    links: [{ label: 'Code & proof', href: gh('GRiddles-Series-B-Puzzle-4'), kind: 'code' }],
    source: 'public',
    figure: 'walk',
    figureCaption: 'A passcode walk: each turn adds or subtracts the next term.',
    sections: [
      {
        heading: 'Solution',
        body: [
          'With V = 1 + a₁ + ⋯ + a_T, Ana guesses V on turn T+1, then V + aₙ and V − aₙ on every later turn. Bob cannot have reached V before turn T, must visit it to win, and both exits from V are guessed.',
          'The one-guess impossibility is argued via a never-merging, ever-branching family of covering walks; one construction step is marked open. Finite-analogue solvers, exhaustive hitting-set search and a pair-search tool back the theory.',
        ],
      },
    ],
  },
  {
    slug: 'fpl-predictor',
    part: 'M-02',
    title: 'Fantasy Premier League predictor',
    kicker: 'A residual network that picks better than most managers',
    date: 'Jan 2025',
    year: 2025,
    category: 'ml',
    tier: 'more',
    summary:
      'Predicts each player’s points from nine engineered features, including opponent difficulty from k-means clustering of team form, trained with a loss that penalises underestimation. Finished in the 84th leaderboard percentile.',
    metrics: [
      { value: '84th', label: 'leaderboard percentile' },
      { value: '9', label: 'features per player' },
    ],
    stack: ['py', 'torch', 'pd'],
    tools: ['PyTorch', 'pandas', 'scikit-learn', 'Cosine annealing', 'Early stopping'],
    links: [],
    source: 'none',
    figure: 'fpl',
    figureCaption: 'Opponent difficulty from k-means clusters of team form.',
    sections: [],
  },
  {
    slug: 'iwm-overnight',
    part: 'M-03',
    title: 'IWM overnight bot',
    kicker: 'Buy the close, sell the open, every trading day',
    date: 'Sep 2026',
    year: 2026,
    category: 'quant',
    tier: 'more',
    summary:
      'A paper-trading bot for Interactive Brokers that captures the overnight return of the Russell 2000 ETF: market-on-close buys, market-on-open sells, session hours fetched from IBKR each day, restart-safe state, and a systemd unit to run it on a Raspberry Pi.',
    metrics: [
      { value: '10%', label: 'of net liquidation per night' },
      { value: 'MOC/MOO', label: 'order types, timed to exchange cut-offs' },
    ],
    stack: ['py', 'pi', 'test'],
    tools: ['ib_async / IB Gateway', 'systemd', 'pytest'],
    links: [],
    source: 'private',
    figure: 'overnight',
    figureCaption: 'Hold from close to open.',
    sections: [],
  },
  {
    slug: 'cota-aero',
    part: 'M-04',
    title: 'COTA aerodynamic design criteria',
    kicker: 'An F1 aero brief for the Circuit of the Americas',
    date: '2025',
    year: 2025,
    category: 'hardware',
    tier: 'more',
    context: 'Aramco F1 Challenge',
    summary:
      'Three quantified design pillars for a ground-effect car at COTA: downforce consistency from 80 kph hairpins to 280 kph sweepers, ride-height robustness on a bumpy clay-soil track, and drag efficiency for the 1.2 km back straight.',
    metrics: [
      { value: '≥3.2', label: 'target lift-to-drag ratio' },
      { value: '<0.8%', label: 'downforce loss per mm of ride height' },
    ],
    stack: ['cad'],
    tools: ['Aerodynamics', 'Technical writing', 'HTML'],
    links: [],
    source: 'private',
    figure: 'aero',
    figureCaption: 'Ground-effect floor and the ride-height window.',
    sections: [],
  },
  {
    slug: 'greenpower',
    part: 'M-05',
    title: 'Greenpower F24 car',
    kicker: 'Designing a school electric race car, with telemetry',
    date: '2022 – 2024',
    year: 2022,
    category: 'hardware',
    tier: 'more',
    context: 'QE GreenPower Team · design team',
    summary:
      'Led the design of the school’s car for Greenpower, the national competition where students design, build and race electric cars, and added an Arduino with a thermistor to log telemetry from it: my first taste of hardware meeting data.',
    metrics: [{ value: 'F24', label: 'class, ages 11–16' }],
    stack: ['ard', 'cpp', 'cad'],
    tools: ['Arduino', 'Thermistor telemetry', 'Fibreglass bodywork'],
    links: [],
    source: 'none',
    figure: 'car',
    figureCaption: 'Side elevation, F24 kit chassis with custom body.',
    sections: [],
  },
];

export const bySlug = (slug: string) => projects.find((p) => p.slug === slug);
export const research = projects.filter((p) => p.tier === 'research');
export const featured = projects.filter((p) => p.tier === 'featured');
export const more = projects.filter((p) => p.tier === 'more');
