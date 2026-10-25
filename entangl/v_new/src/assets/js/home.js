/* G-001 · Cover. Tracing the schematic: point at a connected thing and its line lights up
   back to the asset, the way an engineer runs a highlighter along a one-line. */
(() => {
  'use strict';
  const fig = document.querySelector('[data-schematic]');
  if (!fig) return;
  const trace = fig.querySelector('.sx-trace'), bus = fig.querySelector('.sx-bus'), caption = fig.querySelector('.sx-caption');
  let current = null;
  const on = a => {
    const node = a.closest('.sx-node');
    if (current === node) return;
    off();
    current = node;
    fig.classList.add('has-trace'); node.classList.add('is-traced');
    caption.querySelector('.sx-caption-text').textContent = a.querySelector('.sx-note').textContent; fig.classList.add('has-caption');
    // Light the bus from the asset to this node's tap (side columns only).
    if (matchMedia('(min-width: 861px)').matches && !node.classList.contains('mid')) {
      const b = bus.getBoundingClientRect(), n = node.getBoundingClientRect(), mid = b.left + b.width / 2, x = n.left + n.width / 2;
      trace.style.left = (Math.min(mid, x) - b.left) + 'px';
      trace.style.width = Math.abs(mid - x) + 'px';
      trace.style.transformOrigin = x < mid ? 'right center' : 'left center';
      trace.classList.add('is-on');
    }
  };
  const off = () => {
    if (!current) return;
    current.classList.remove('is-traced'); fig.classList.remove('has-trace', 'has-caption'); trace.classList.remove('is-on');
    current = null;
  };
  fig.addEventListener('pointerover', e => { const a = e.target.closest('.sx-node a'); if (a) on(a); });
  fig.addEventListener('pointerleave', off);
  fig.addEventListener('focusin', e => { const a = e.target.closest('.sx-node a'); if (a) on(a); });
  fig.addEventListener('focusout', e => { if (!fig.contains(e.relatedTarget)) off(); });
})();
