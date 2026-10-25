// The sheet register: every page of the site is a sheet in one issued set.
// Status follows the original site's product scope exactly:
//   core    – a core workflow today
//   scoped  – scoped with each deployment ("explore the scope")
//   planned – a planned workflow, shown as an interactive concept
export const ISSUE = { rev: 'C', date: '25 OCT 2026', status: 'Issued for review' };

export const STATUS = {
  core: { label: 'Core workflow', short: 'Core', line: 'Solid line' },
  scoped: { label: 'Scoped with your deployment', short: 'Scoped', line: 'Light line' },
  planned: { label: 'Planned workflow', short: 'Planned', line: 'Dashed line' },
};

export const GROUPS = [
  { id: 'general', title: 'General' },
  { id: 'lifecycle', title: 'Full lifecycle' },
  { id: 'platform', title: 'Platform' },
  { id: 'enterprise', title: 'Enterprise' },
  { id: 'proof', title: 'Proof & research' },
];

export const SHEETS = [
  { route: '/', num: 'G-001', title: 'Cover', group: 'general' },
  { route: '/who-its-for/', num: 'G-002', title: 'Who it’s for', group: 'general' },
  { route: '/about/', num: 'G-003', title: 'About Entangl', group: 'general' },
  { route: '/demo/', num: 'G-004', title: 'Book a site demo', group: 'general' },

  { route: '/lifecycle/', num: 'L-101', title: 'The connected lifecycle', group: 'lifecycle' },
  { route: '/lifecycle/design-and-handover/', num: 'L-102', title: 'Design & handover', group: 'lifecycle', status: 'planned' },
  { route: '/lifecycle/vendors-and-rfps/', num: 'L-103', title: 'Vendors & RFPs', group: 'lifecycle', status: 'planned' },
  { route: '/experience/', num: 'L-104', title: 'The connected facility', group: 'lifecycle' },

  { route: '/platform/', num: 'P-201', title: 'Platform overview', group: 'platform' },
  { route: '/platform/site-model/', num: 'P-202', title: 'Your site model', group: 'platform', status: 'core' },
  { route: '/platform/procedures/', num: 'P-203', title: 'Write procedures', group: 'platform', status: 'core' },
  { route: '/platform/review/', num: 'P-204', title: 'Review & approvals', group: 'platform', status: 'core' },
  { route: '/platform/fieldwork/', num: 'P-205', title: 'Fieldwork & training', group: 'platform', status: 'scoped' },
  { route: '/platform/telemetry/', num: 'P-206', title: 'AI telemetry', group: 'platform', status: 'scoped' },
  { route: '/platform/visibility/', num: 'P-207', title: 'Customer & audit visibility', group: 'platform', status: 'scoped' },
  { route: '/platform/maintenance/', num: 'P-208', title: 'Maintenance planning', group: 'platform', status: 'planned' },
  { route: '/platform/portfolio/', num: 'P-209', title: 'Portfolio performance', group: 'platform', status: 'planned' },

  { route: '/enterprise/integrations/', num: 'E-301', title: 'Systems & integrations', group: 'enterprise' },
  { route: '/enterprise/security/', num: 'E-302', title: 'Security & deployment', group: 'enterprise' },
  { route: '/enterprise/rollout/', num: 'E-303', title: 'Implementation & support', group: 'enterprise' },
  { route: '/pricing/', num: 'E-304', title: 'Pricing & scope', group: 'enterprise' },

  { route: '/proof/', num: 'R-401', title: 'Customer evidence', group: 'proof' },
  { route: '/proof/example/', num: 'R-402', title: 'A procedure review example', group: 'proof' },
  { route: '/answers/', num: 'R-403', title: 'Buyer questions', group: 'proof' },
  { route: '/evaluate/', num: 'R-404', title: 'Plan an evaluation', group: 'proof' },
  { route: '/outage-report/', num: 'R-405', title: 'Annual outage report', group: 'proof' },

  // Sheets that exist but are not listed in the index.
  { route: '/outage-report/thank-you/', num: 'R-405.1', title: 'Report request', group: 'proof', hidden: true },
  { route: '/outage-report/email-preview/', num: 'R-405.2', title: 'Report email', group: 'proof', hidden: true },
  { route: '/404', num: 'X-000', title: 'Sheet not found', group: 'general', hidden: true },
];

export const sheetFor = route => SHEETS.find(s => s.route === route);
