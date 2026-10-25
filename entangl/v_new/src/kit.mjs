// Shared drawing vocabulary for every sheet: detail callouts, stamps, references,
// note marks, status chips, buttons and line symbols.
import { STATUS } from './sheets.mjs';

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const attrs = o => Object.entries(o).filter(([, v]) => v !== undefined && v !== false && v !== null)
  .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ');

// Line symbols, drawn on a 24-unit grid with a 1.5 stroke, like a drawing legend.
export const ICONS = {
  drawing: '<rect x="3.5" y="3.5" width="17" height="17"/><path d="M13 20.5v-5h7.5M13 17.75h7.5M6.5 7.5h4v4h-4zM10.5 9.5h3l2 3"/>',
  manual: '<path d="M4 5.5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0zM12 5.5c2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0"/><path d="M6.5 9h3M6.5 12h3M14.5 9h3"/>',
  procedure: '<path d="M8 4.5H5.5v16h13v-16H16"/><rect x="8" y="3" width="8" height="3" rx=".5"/><path d="M8 10.5l1.5 1.5 2.5-3M13.5 11h3M8 16l1.5 1.5 2.5-3M13.5 16.5h3"/>',
  person: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
  part: '<path d="M12 3.5l8 4.5v8l-8 4.5-8-4.5V8z"/><path d="M4 8l8 4.5L20 8M12 12.5v8"/>',
  record: '<path d="M3.5 6.5h6l2 2h9v11h-17z"/><path d="M8.5 14l2.5 2.5 4.5-5"/>',
  asset: '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M8.5 8h7M8.5 11h7M8.5 16.5h2M13.5 16.5h2M12 1.5V4M12 20v2.5"/>',
  signal: '<path d="M2.5 12h4l2.5-6 4 12 2.5-6h6"/>',
  arrow: '<path d="M4 12h15M14 7l5 5-5 5"/>',
  diagonal: '<path d="M7 17L17 7M9 7h8v8"/>',
  down: '<path d="M12 4v15M7 14l5 5 5-5"/>',
  up: '<path d="M12 20V5M7 10l5-5 5 5"/>',
  back: '<path d="M20 12H5M10 7l-5 5 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3.5 2.5-5.5 5.5-5.5s5.5 2 5.5 5.5M15.5 5.2a3 3 0 0 1 0 5.6M17 14.2c2.2.6 3.5 2.4 3.5 5.3"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 7.5-7.5 9.5-4.3-2-7.5-5-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  tablet: '<rect x="5" y="2.5" width="14" height="19" rx="1.5"/><path d="M10 18.5h4"/>',
  capacity: '<path d="M4 20.5V12h4v8.5M10 20.5V7h4v13.5M16 20.5V3.5h4v17M2.5 20.5h19"/>',
  grid: '<rect x="4" y="4" width="16" height="16"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  wave: '<path d="M2.5 12c2-4 4-4 6 0s4 4 6 0 4-4 7 0"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>',
  print: '<path d="M7 8V3.5h10V8M7 17H4.5V9.5h15V17H17M7 13.5h10v7H7z"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="12"/><path d="M15.5 8.5v-5h-11v12h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  stamp: '<path d="M9 3.5h6v5l2.5 3.5h-11L9 8.5zM5 15h14v3H5zM6.5 20.5h11"/>',
  motion: '<path d="M3 12h3M8 12c1.5-5 3-5 4 0s2.5 5 4 0M18 12h3"/>',
  pm: '<path class="pm-h" d="M5 12h14"/><path class="pm-v" d="M12 5v14"/>',
};
export const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.file}</svg>`;

// Detail callout: a circle split by a line, detail number over sheet number. Used as
// the heading mark for every section, exactly as details are titled on a drawing.
export const bubble = (n, sheet) => `<span class="bubble" aria-hidden="true"><span>${esc(n)}</span><span>${esc(sheet)}</span></span>`;
export function detail({ n, sheet, kicker, title, scale = 'NTS', id, level = 2, lead, cls = '' }) {
  const h = `h${level}`;
  return `<header class="detail ${cls}">${bubble(n, sheet)}<div class="detail-text">${kicker ? `<p class="detail-kicker">${esc(kicker)}</p>` : ''}<${h} class="detail-title"${id ? ` id="${id}"` : ''}>${title}</${h}></div><p class="detail-scale"><span>Scale</span> ${esc(scale)}</p></header>${lead ? `<p class="detail-lead">${lead}</p>` : ''}`;
}

export const stamp = (text, tone = '') => `<span class="stamp ${tone}">${text}</span>`;
export const code = text => `<span class="code">${esc(text)}</span>`;
export const chip = status => status ? `<span class="chip chip-${status}" title="${esc(STATUS[status].label)}"><i aria-hidden="true"></i>${esc(STATUS[status].short)}</span>` : '';
export const statusLine = status => status ? `<span class="status-line status-${status}"><i aria-hidden="true"></i>${esc(STATUS[status].label)}</span>` : '';

export const btn = (href, label, variant = 'ink', ic = 'arrow') => `<a class="btn btn-${variant}" href="${esc(href)}"><span>${label}</span>${ic ? icon(ic) : ''}</a>`;
export const tlink = (href, label, ic = 'arrow') => {
  const ext = /^https?:/.test(href);
  return `<a class="tlink" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}><span>${label}</span>${icon(ext ? 'diagonal' : ic)}${ext ? '<span class="sr-only"> (opens in a new tab)</span>' : ''}</a>`;
};

// A reference to another sheet, written the way drawings cross-reference: number, then title.
export function sheetRef(sheet, label) {
  return `<a class="sref" href="${esc(sheet.route)}"><span class="sref-num">${esc(sheet.num)}</span><span class="sref-title">${esc(label || sheet.title)}</span>${sheet.status ? chip(sheet.status) : ''}${icon('arrow')}</a>`;
}

// Questions are logged the way a project logs requests for information.
export function rfiList(items, { prefix = 'RFI', openFirst = true, idBase = 'rfi', start = 1 } = {}) {
  return `<ol class="rfi" start="${start}">${items.map(([q, a, extra], i) => `<li><details${openFirst && i === 0 ? ' open' : ''} id="${idBase}-${i + start}"><summary><span class="rfi-num">${prefix}-${String(i + start).padStart(2, '0')}</span><span class="rfi-q">${esc(q)}</span>${icon('pm', 'i rfi-mark')}</summary><div class="rfi-a"><p>${a}</p>${extra || ''}</div></details></li>`).join('')}</ol>`;
}

export const pad2 = n => String(n).padStart(2, '0');

// Numbered note references for a page: notes are numbered in the order they are listed.
export const noteRefs = notes => id => {
  const i = notes.findIndex(n => n.id === id);
  if (i < 0) throw new Error('Unknown note ' + id);
  return `<a class="nref" href="#n-${id}" data-note="${id}" aria-label="Note ${i + 1}">${i + 1}</a>`;
};

// The head of every sheet after the cover: path, title, status, lead, actions.
export function sheetHead({ sheet, trail = [], kicker, title, lead, actions = '', status, aside = '', keys }) {
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/"><span class="code">G-001</span> Cover</a>${trail.map(t => `<span aria-hidden="true">/</span><a href="${t.route}"><span class="code">${t.num}</span> ${esc(t.title)}</a>`).join('')}<span aria-hidden="true">/</span><span aria-current="page"><span class="code">${sheet.num}</span> ${esc(sheet.title)}</span></nav>`;
  const t = Array.isArray(title) ? title.map((l, i) => i ? `<span>${l}</span>` : l).join(' ') : title;
  return `<header class="sheet-head wrap">${crumbs}
  <div class="sheet-head-grid">
    <div>${kicker ? `<p class="detail-kicker">${kicker}</p>` : ''}<h1 class="h1 sheet-title">${t}</h1></div>
    <div class="sheet-head-side">${status ? `<p class="sheet-status">${statusLine(status)}</p>` : ''}${lead ? `<div class="lead">${lead}</div>` : ''}${actions ? `<div class="actions">${actions}</div>` : ''}${aside}</div>
  </div>${keys ? `<ol class="keys">${keys.map((k, i) => `<li><span class="code">${pad2(i + 1)}</span>${k}</li>`).join('')}</ol>` : ''}
</header>`;
}

// A numbered list drawn as clauses, used for steps on enterprise, proof and lifecycle sheets.
export const clauses = (items, { n = 1, cols = 2 } = {}) => `<ol class="spec${cols === 1 ? ' spec-1' : ''}">${items.map(([t, c], i) => `<li><span class="code">${n}.${i + 1}</span><h3>${t}</h3>${c ? `<p>${c}</p>` : ''}</li>`).join('')}</ol>`;

// The standard close: bring us a task.
export const closeNext = ({ kicker = 'Your site is next', title = 'Bring us a task your team knows well.', copy = 'Bring a procedure, a review bottleneck, or a site question. Agree what to test and what a useful result looks like.', href = '/demo/', label = 'Book a site demo' } = {}) => `<section class="sec" aria-labelledby="next-title"><div class="wrap next"><div><p class="detail-kicker">${kicker}</p><h2 class="h1" id="next-title">${title}</h2><p class="lead">${copy}</p></div><div class="next-act">${btn(href, label, 'ink')}<p class="fine">No site files needed to book. We’ll agree how to share them if an evaluation follows.</p></div></div></section>`;
