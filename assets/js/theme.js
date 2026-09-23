// Colour and naming for every categorical encoding on the site.
// Chart hues are validated for the dark surface (OKLCH L 0.48-0.67, adjacent CVD dE >= 8)
// in the listed order; 3D glow uses the same hues, brightened in the shaders.

export const CLASS_ORDER = [
  "optic", "central", "visual_projection", "sensory", "ascending",
  "descending", "visual_centrifugal", "motor", "endocrine", "sensory_ascending",
];

export const CLASSES = {
  optic:              { label: "Optic lobe",          color: "#3987e5", blurb: "Intrinsic neurons of the two visual lobes" },
  central:            { label: "Central brain",        color: "#d95926", blurb: "Intrinsic neurons of the central brain" },
  visual_projection:  { label: "Visual projection",    color: "#199e70", blurb: "Carry vision from the optic lobes into the central brain" },
  sensory:            { label: "Sensory",              color: "#c98500", blurb: "Photoreceptors, smell, taste, touch, hearing" },
  ascending:          { label: "Ascending",            color: "#d55181", blurb: "Bring signals up from the body's nerve cord" },
  descending:         { label: "Descending",           color: "#008300", blurb: "Carry the brain's commands down to the body" },
  visual_centrifugal: { label: "Visual centrifugal",   color: "#9085e9", blurb: "Feed back from the central brain to the optic lobes" },
  motor:              { label: "Motor",                color: "#e66767", blurb: "Move the proboscis, antennae, neck and eyes" },
  endocrine:          { label: "Endocrine",            color: "#f09bbb", blurb: "Release hormones into the body" },
  sensory_ascending:  { label: "Sensory ascending",    color: "#e8c46a", blurb: "Sensory neurons entering from the body" },
  "":                 { label: "Unclassified",         color: "#77738f", blurb: "" },
};

// Charts fold the three smallest classes into one slot.
export const CHART_CLASSES = ["optic", "central", "visual_projection", "sensory", "ascending", "descending", "visual_centrifugal", "other"];
export const CHART_CLASS_COLOR = {
  optic: "#3987e5", central: "#d95926", visual_projection: "#199e70", sensory: "#c98500",
  ascending: "#d55181", descending: "#008300", visual_centrifugal: "#9085e9", other: "#e66767",
};
export const chartClassOf = (c) => (c === "motor" || c === "endocrine" || c === "sensory_ascending" || c === "") ? "other" : c;

export const NT_ORDER = ["acetylcholine", "gaba", "glutamate", "octopamine", "dopamine", "serotonin"];
export const NTS = {
  acetylcholine: { label: "Acetylcholine", short: "ACh", color: "#d95926", role: "excitatory" },
  gaba:          { label: "GABA",          short: "GABA", color: "#3987e5", role: "inhibitory" },
  glutamate:     { label: "Glutamate",     short: "Glu", color: "#199e70", role: "mostly inhibitory in flies" },
  octopamine:    { label: "Octopamine",    short: "OA", color: "#c98500", role: "neuromodulator" },
  dopamine:      { label: "Dopamine",      short: "DA", color: "#d55181", role: "neuromodulator" },
  serotonin:     { label: "Serotonin",     short: "5-HT", color: "#008300", role: "neuromodulator" },
  "":            { label: "Unknown",       short: "?", color: "#77738f", role: "" },
};

export const SIDES = {
  left:   { label: "Left hemisphere",  color: "#3987e5" },
  right:  { label: "Right hemisphere", color: "#d95926" },
  center: { label: "Midline",          color: "#c98500" },
  na:     { label: "Unassigned",       color: "#77738f" },
  "":     { label: "Unassigned",       color: "#77738f" },
};

// Neuropil systems (Ito et al. 2014). 3D-only colours, identified by name on hover.
export const SYSTEM_COLORS = {
  optic: "#5b8cff", mb: "#ff6fae", cx: "#ffcf5a", al: "#5fe3b5", lh: "#b18cff", snp: "#ff9a5a",
  vlnp: "#6fd0ff", lx: "#e9f27a", inp: "#c3a3ff", vmnp: "#7affd4", penp: "#ffa3a3", gng: "#ffd8a8",
  ocg: "#a8b8ff", brain: "#b9b3ff",
};

export const SYSTEM_BLURBS = {
  optic: "Four layered visual neuropils per eye: lamina, medulla, lobula and lobula plate process colour, motion and form.",
  mb: "The mushroom bodies: about 2,500 Kenyon cells per side store learned associations between odours and outcomes.",
  cx: "The central complex keeps an internal compass and steers navigation.",
  al: "Olfactory receptor neurons of each type converge on one of ~50 glomeruli.",
  lh: "Innate, hard-wired responses to smells: attraction, aversion, pheromones.",
  snp: "Integrative hub of the dorsal brain, rich in memory output and neuromodulation.",
  vlnp: "Where visual projection neurons land: object, looming and colour features.",
  lx: "Premotor steering centre linking the compass to descending neurons.",
  inp: "Interconnected zones around the mushroom body lobes.",
  vmnp: "Descending neurons gather their inputs here before heading to the body.",
  penp: "Hearing, wind and gravity sensing from the antennae, plus neuroendocrine zones.",
  gng: "Taste, feeding and the gateway to the body's nerve cord.",
  ocg: "Relays from the three ocelli, simple eyes on top of the head.",
};

export const REGION_BLURBS = {
  AL: "Sorts odours into ~50 glomeruli, one per receptor type.",
  MB_CA: "Kenyon cells collect olfactory input here.",
  MB_PED: "The stalk of Kenyon cell axons.",
  MB_VL: "Memory compartments where dopamine rewrites outputs.",
  MB_ML: "Memory compartments where dopamine rewrites outputs.",
  LH: "Innate odour responses.",
  EB: "A ring of neurons tracking the fly's heading.",
  FB: "Navigation, sleep and goal-directed steering.",
  PB: "A row of 18 glomeruli mapping compass directions.",
  NO: "Tracks the fly's own speed and turning.",
  LA: "First relay from photoreceptors R1-6.",
  ME: "The largest neuropil: columnar visual processing.",
  LO: "Object and feature detection.",
  LOP: "Motion direction layers.",
  AME: "Clock neurons receive light input here.",
  GNG: "Taste and feeding circuits; gateway to the body.",
  AMMC: "Hearing and antennal mechanosensation.",
  WED: "Sound and wind direction.",
  LAL: "Steering commands.",
  AOTU: "Sky-compass and colour pathway to the central complex.",
  PVLP: "Looming and object detectors land here.",
  AVLP: "Auditory and visual integration.",
  SMP: "Dorsal integration hub.",
  SLP: "Olfactory and metabolic integration.",
  SIP: "Mushroom body output target.",
  PLP: "Visual projection targets.",
  IPS: "Descending neurons for flight and walking.",
  SPS: "Descending neurons for flight and walking.",
  VES: "Descending neuron inputs.",
  FLA: "Neuroendocrine cells.",
  PRW: "Taste relay.",
  SAD: "Mechanosensory relay.",
  CAN: "Small dorsal neuropil.",
  OCG: "Ocellar relay.",
  BU: "Relays sky-compass signals to the ellipsoid body.",
  GA: "Links the ellipsoid body and the lateral accessory lobe.",
};

export function glow(hex, k = 1.35) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  // lift toward white while keeping hue, for luminous 3D marks
  return c.map((v) => Math.min(1, v * k + 0.08));
}
