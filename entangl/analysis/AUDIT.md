# entangl.com: UX and functional audit

Scope: every page on entangl.com (28 URLs, from the sitemap plus the unlinked thank-you, email-preview and 404 pages), as mirrored in `../v_original`.

Brief: find the small things (jolts, readability, transitions, sloppiness) and fix them without redesigning anything. Keep the voice, palette, layout and interaction model. Only remove friction.

The site is already well made. It has no horizontal overflow on any page at any width, load-time layout shift is near zero, there are no console errors or broken links, the forms are labelled and autocompleted, and reduced motion is respected. The problems are almost all at the edges: short laptop screens, phones held sideways, thumbs instead of cursors, and the moment one piece of content swaps for another. That's where this audit looks.

---

## 1. How it was measured

| Scenario | Viewport | Why it matters |
| --- | --- | --- |
| `phone-small` | 320 × 568, touch, 2× | iPhone SE / small Android, the narrowest real layout |
| `phone` | iPhone 13 (390 × 664 visible), touch, 3× | the most common phone |
| `phone-landscape` | 844 × 390, touch | phone turned sideways while reading |
| `tablet-portrait` | 820 × 1180, touch | iPad Air |
| `tablet-landscape` | 1180 × 820, touch | iPad with keyboard; a touch device with a desktop layout |
| `laptop-small` | 1280 × 720 | 13" laptop after browser chrome, and the 1366 × 768 class |
| `laptop` | 1440 × 900 | MacBook Air / Pro |
| `desktop` | 1920 × 1080 | external monitor |
| `wide` | 2560 × 1440 | large monitor |
| `zoom-200` | 640 × 400 at 2× | 200% browser zoom on a laptop (WCAG reflow) |

Tools (all in `../tools`, rerunnable against any deployment):

- `audit.cjs` loads every page in every scenario and measures:
  - layout shift during load and during a reader-paced wheel scroll, with the elements that moved
  - horizontal overflow
  - tap targets under 24 px (WCAG 2.5.8) and under 44 px (Apple/Google guidance) on touch
  - text under 12 px
  - text contrast against its real background
  - orphaned last words in headings
  - form field sizing and autocomplete
  - focus visibility while tabbing
  - long tasks and frames over 50 ms while scrolling
  - console errors and failed requests
- `interactions.cjs` drives the menus, sign-in dialog, tab switches, in-page anchors, FAQ deep links and the demo form, and records what happens.
- `storyboard.cjs` captures what a reader sees, frame by frame, while scrolling. Every finding below marked *visual* was confirmed on these frames.

Form submissions and Cloudflare's bot script are blocked in every tool, so no run ever sends a request.

### Baseline (v_original, totals across all 28 pages)

| Scenario | Overflow | Max CLS load | Max CLS scroll | Tap < 24 px | Tap < 44 px | Text < 12 px | Contrast < AA | Orphans | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phone-small | 0 | 0.000 | 0.070 | 492 | 1137 | 177 | 577 | 105 | 0 |
| phone | 0 | 0.000 | 0.060 | 734 | 1136 | 177 | 577 | 52 | 0 |
| phone-landscape | 0 | 0.000 | 0.037 | 879 | 1121 | 124 | 584 | 46 | 0 |
| tablet-portrait | 0 | 0.000 | 0.021 | 879 | 1119 | 124 | 584 | 49 | 0 |
| tablet-landscape | 0 | 0.011 | 0.092 | 877 | 1093 | 111 | 593 | 23 | 0 |
| laptop-small | 0 | 0.013 | 0.104 | 877 | n/a | 110 | 593 | 17 | 0 |
| laptop | 0 | 0.009 | 0.083 | 877 | n/a | 110 | 593 | 11 | 0 |
| desktop | 0 | 0.004 | 0.041 | 877 | n/a | 110 | 593 | 11 | 0 |
| wide | 0 | 0.002 | 0.020 | 877 | n/a | 110 | 593 | 11 | 0 |
| zoom-200 | 0 | **0.091** | 0.052 | 870 | n/a | 119 | 581 | 17 | 0 |

Raw counts are blunt. A footer link counts once per page, so 20 footer links make 560 rows. The findings below group them by cause, and the cause is what gets fixed.

---

## 2. Findings

Severity:
- **High**: a visitor would notice and it costs them something (a hidden action, a dead tap, broken words).
- **Medium**: noticeable polish loss, or an accessibility failure.
- **Low**: a refinement.

Every fix is small: one rule, one attribute or a few lines of script.

### A. Reading

**A1. Words run together on phones (High, visual).** Four headings and intros use `<br>` to break lines on desktop, and CSS hides that `<br>` on small screens. Nothing separates the words, so phones show:

- "Start with the **pressureyou’re** under." (homepage, pressure section, ≤ 760 px)
- "One facility. Different **decisions.Follow** the connection…" (homepage, moments intro, ≤ 760 px)
- the lifecycle intro (`.life-intro p br`) and the platform review count (`.pp-review-count span br`)

*Fix:* put a space before each of those `<br>`s. A space before a line break is invisible when the break shows and becomes the word gap when it's hidden.

**A2. Orphaned last words (Medium, visual).** Headings that end on a single word: 105 on a 320 px phone, 52 on a 390 px phone. Examples: the hero eyebrow "AI FOR DATA CENTER ENGINEERING AND / OPERATIONS", "One finding. Follow the / evidence.", "Calculate workload as your portfolio / grows." The site already uses `text-wrap: balance` in five places, but not as a rule.

*Fix:* `text-wrap: balance` on headings and eyebrows, and `text-wrap: pretty` on body copy, site-wide. Browsers without support ignore it.

**A3. Value statistic breaks onto two lines (High, visual, phone).** The third value card shows "$10" with "k" dropped onto its own line at 320–390 px.

*Fix:* `white-space: nowrap` on `.value-stat`.

**A4. Secondary text below AA contrast (Medium).** Measured on light backgrounds:

| Element | Colour | Contrast | Size |
| --- | --- | --- | --- |
| `--muted` (eyebrows, footer utilities, small print) | `#617167` | 4.2:1 | 12 px |
| `.section-index` numerals | `#779368` | 3.1:1 | |
| `.chapter-number` | `#819972` | 2.9:1 | |
| `.pp-detail-number` | `#788e65` | 3.0:1 | |
| `.copy-question` | `#658251` | 4.0:1 | |
| `small` captions | `#667c58` | 3.6:1 | |
| `.pressure-index-number` | `#708459` | 4.0:1 | |

These labels are what a buyer scans for orientation.

*Fix:* darken each by one step within the same hue, to at least 4.5:1. Next to the original the change is barely visible, but it makes these labels legible in bright light.

**A5. Text set below 12 px (Low).** The lifecycle stage numbers and "Scroll to explore the life of the facility" are 11 px, and the mobile chapter label is 10 px. The labels painted inside the 3D illustration are part of the drawing and are left alone.

*Fix:* raise those UI labels to 12 px.

**A6. Report figures don't share a baseline (Low, visual, phone).** On `/outage-report/`, "52 Pages · 9 Detailed cases · 12 Months of incidents": the "12" sits 20 px higher than the other two, because its label wraps to two lines and `column-reverse` packs each column from the bottom.

*Fix:* `justify-content: flex-end` (the top, in a reversed column).

### B. Touch and interaction

**B1. Tap targets too small (High on touch).** The causes:

| Element | Size | Where |
| --- | --- | --- |
| Footer link | 165 × 22 | 20 per page, every page |
| Footer utility row (Contact, Sign in, Reduce motion, Back to top) | 19 px tall | every page |
| Menu button | 31 × 39 | every page on phone |
| Header CTA | 41 px tall | every page on phone |
| 3D model controls (rotate, zoom, home, pause) | 29 × 29 | homepage on phone |
| Inline text links | 37–40 px tall | |
| Checkboxes | 18 × 18 | demo form |

The footer links sit 32 px apart, so a thumb that lands in the gap does nothing.

*Fix:*
- Extend each footer link's hit area to the full row with block padding and an equal negative margin. The visual rhythm doesn't change.
- Make the menu button 44 × 44 and the header CTA 44 px tall.
- On coarse pointers only, make the model controls 40 px and give text links 44 px minimum.

**B2. No feedback on tap (Medium, touch).** The site sets `-webkit-tap-highlight-color: transparent` and puts nothing in its place, so on a phone, tapping a link or button gives no acknowledgement until the next page paints.

*Fix:* a subtle pressed state (dim to 72% for the instant of contact) on devices without hover.

**B3. The mobile menu has no transition and no edges (High).** Measured in `interactions.cjs`:

- It appears and disappears in 0 ms.
- The page behind stays live. Scrolling with the menu open moved the page underneath by **3,600 px** while the menu stayed put.
- With a section expanded, the menu (874 px of content in 591 px) scrolls, and at its end the scroll chains through to the page.
- Nothing dims the page, so the menu reads as part of it rather than over it.

*Fix:*
- A 200 ms fade and lift.
- Lock page scroll while the menu is open.
- `overscroll-behavior: contain` on the menu.
- A soft scrim over the page. Tapping the scrim already closes the menu (existing outside-click handler).

**B4. Value cards change content off-screen on phones (High).** Below 650 px the three value cards stack and the panel they control sits under all three. Tapping "Explore the renewal opportunity →" swaps a panel whose top is 665–917 px down a 664 px viewport. Nothing visible happens, and the tap reads as broken.

*Fix:* when the cards are stacked, bring the newly selected panel into view (smooth scroll, instant under reduced motion).

**B5. Moments panel changes height (Medium, phone).** Switching between the six "Choose a moment" tabs resizes the answer panel between 240 and 271 px, so everything below it jumps by 31 px with each tap.

*Fix:* hold the panel at the height of its tallest answer (measured, and re-measured on resize).

**B6. Moment tabs are clipped with no hint (Medium, visual, phone).** The tab row scrolls sideways, but the third tab is cut mid-word ("Alarm investiga") at the screen edge, with no fade or other sign that it continues.

*Fix:* fade the trailing edge while there's more to scroll, and keep the selected tab scrolled into view.

**B7. The page scrolls behind the sign-in dialog (Medium).** The dialog is modal, but the page under it isn't locked: wheel or touch-scrolling over the backdrop or the dialog scrolls the page 800 px per notch. When the dialog closes, the reader is somewhere else.

*Fix:* hold page scroll while any modal dialog is open (`html:has(dialog[open])`), keeping the scrollbar gutter so nothing shifts sideways.

### C. Motion and transitions

**C1. Content swaps are instant (Low).** The desktop mega-menu, the sign-in dialog, the value panels and the moment answers all switch in a single frame. Elsewhere the site moves carefully (the lifecycle morph, chevron rotation), so the hard cuts stand out.

*Fix:* 160–220 ms fades on the dropdown, dialog (with backdrop), value panel and moment answer, using the site's own `--ease`. All of it is off under reduced motion through the site's existing global rule.

**C2. The 3D model jumps on load at narrow widths (Medium).** The model's CSS start position (top 20.5%, height 61%) differs from where `lifecycle-hero.js` puts it on narrow screens (top ≥ 175 px, height ≥ 150 px). If the first paint happens before the script runs, the model visibly drops and shrinks. The audit caught this at 640 px (CLS **0.091**). It's a race, so it's likelier on slower phones.

*Fix:* the model is drawn by script and shows nothing without it, so keep its frame invisible until the script has positioned it, then fade it in.

**C3. Lifecycle stage buttons are moved with `left`/`top` on every scroll frame (Low).** They already use `transform` to centre themselves, but their position is written to `left`/`top` on each frame of the morph. That forces layout every frame and is why CLS records 0.06–0.10 while scrolling the hero. Visually the movement is smooth and intended; the cost is wasted work on the main thread.

*Fix:* write the position to the CSS `translate` property instead. It composes with the existing centring transform and needs no layout.

### D. Constrained screens

**D1. The lifecycle's interactive card is cut off (High, visual).** The left column of the pinned lifecycle story is its own scroll area with a near-invisible scrollbar (25% alpha), and none at all on phones. When the column is taller than the screen, the "In the facility" card is cut off by a hard edge:

- **1440 × 900:** only the top half shows.
- **1280 × 720:** the card's action button ("Verify the cooling test") is hidden entirely.
- **Phone:** the card is cut in all six stages.

There's no sign that more is there.

*Fix:*
1. On short desktop viewports (≤ 820 px tall), drop the one-line description under each bullet, as the phone layout already does, so the card fits.
2. Fade the bottom edge of the column while there's more below it, so the overflow is visible.

**D2. Legend and controls overlap (Low, visual, laptop).** The scene legend ("3 commissioning crew · Temporary test equipment") is centred across the full model width, and its end runs underneath the rotate and zoom controls.

*Fix:* end the legend before the controls.

**D3. Landscape phones lose the lifecycle story (High, phone-landscape).**
- The sticky header takes **19%** of a 390 px screen.
- The pinned lifecycle stage has a 430 px minimum, taller than the 317 px left under the header, so the bullets, the card and stages 05–06 of the rail are never on screen while it's pinned.
- The story uses the stacked portrait layout, which shrinks the model to a 120 px thumbnail with overlapping labels.

*Fix:*
- On short landscape screens, make the header compact (56 px).
- Let the pinned stage size to the real viewport.
- Use the side-by-side layout whenever the screen is wider than it is tall. That's a one-condition change in `journeyLayout`.

### E. Things checked and found sound (no change)

- **Horizontal overflow:** none, on any page, at any width, including 320 px and 200% zoom.
- **Load-time layout shift:** ≤ 0.013 everywhere except C2.
- **Errors:** no console errors and no failed requests on any page.
- **In-page anchors:** they land 90–150 px below the sticky header (`scroll-padding-top: 106px`), never under it.
- **FAQ deep links:** `/answers/#…` opens the right answer and clears filters. The empty-search state shows.
- **Demo form:** 16 px fields (no iOS zoom), correct `autocomplete`, and an empty submit focuses the first invalid field.
- **Reduced motion:** the OS setting and the in-page toggle both stop animation, transitions and smooth scrolling.
- **Value-section number input:** the audit flagged `outline: none !important`, but the wrapper draws the ring through `:focus-within`. False positive.
- **Sign-in dialog:** focus goes to the close button. (The page scrolling behind it is B7.)

### F. Deliberately left alone

These would need design decisions, not fixes:
- the vertical stage rail on phones
- the length of the two-column footer on phones
- whether the desktop mega-menu should stay open while the page scrolls
- the WebGL render cost while the model resizes during the hero morph

That last one is inherent to drawing the model at its true size. Headless measurements (software GL) exaggerate it, so it isn't counted against the site here.

---

## 3. Results

Measured on `../v_improved` with the same tools, scenarios and pages as the baseline. Bold figures changed.

### Measured, all 28 pages

| Scenario | Overflow | Max CLS load | Max CLS scroll | Tap < 24 px | Tap < 44 px | Text < 12 px | Contrast < AA | Orphans | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phone-small | 0 | 0.000 | 0.070 → **0.000** | 492 → **60** | 1137 → **616** | 177 → **139** | 577 → **340** | 105 → **58** | 0 |
| phone | 0 | 0.000 | 0.060 → **0.000** | 734 → **59** | 1136 → **856** | 177 → **139** | 577 → **340** | 52 → **31** | 0 |
| phone-landscape | 0 | 0.000 | 0.037 → **0.019** | 879 → **69** | 1121 → **1003** | 124 → **116** | 584 → **347** | 46 → **21** | 0 |
| tablet-portrait | 0 | 0.000 | 0.021 → **0.000** | 879 → **69** | 1119 → **1001** | 124 → **117** | 584 → **347** | 49 → **22** | 0 |
| tablet-landscape | 0 | 0.011 | 0.092 → **0.013** | 877 → **67** | 1093 → **1002** | 111 → **99** | 593 → **356** | 23 → **12** | 0 |
| laptop-small | 0 | 0.013 | 0.104 → **0.009** | 877 → **67** | n/a | 110 → **98** | 593 → **356** | 17 → **11** | 0 |
| laptop | 0 | 0.009 | 0.083 → **0.007** | 877 → **67** | n/a | 110 → **98** | 593 → **356** | 11 → **8** | 0 |
| desktop | 0 | 0.004 | 0.041 → **0.003** | 877 → **67** | n/a | 110 → **98** | 593 → **356** | 11 → **7** | 0 |
| wide | 0 | 0.002 | 0.020 → **0.002** | 877 → **67** | n/a | 110 → **98** | 593 → **356** | 11 → **7** | 0 |
| zoom-200 | 0 | 0.091 → **0.044** | 0.052 → **0.020** | 870 → **60** | n/a | 119 → **111** | 581 → **344** | 17 → **10** | 0 |

- **Layout shift while scrolling** dropped to effectively zero on every touch device and laptop. The stage buttons no longer force layout (C3) and the model no longer drops into place after first paint (C2). At 200% zoom the shift during load halved as well.
- **Small tap targets:** 30–35 per page under 24 px became 2–3. These are what's left:
  - links set inline in running text, which WCAG exempts
  - the demo form's checkboxes, whose labels are the real target
- **Touch targets under 44 px** are down by 10–45%. The remaining ones are compact controls inside the interactive examples (chips, steppers, segmented buttons). Enlarging those would change the examples' layout, so they're outside a "small fixes" brief.
- **Contrast failures** fell by 40%. Most of the rest are near misses: body copy and links at 4.2–4.49:1 against a 4.5:1 target, spread across many individual colours. Each needs a one-value change, listed here as a follow-up rather than done wholesale.
- **Text under 12 px:** what remains is in the `/experience/` embed and the labels painted into the 3D illustration. Both were deliberately left alone.
- **No regressions:** no horizontal overflow, console errors or failed requests in any scenario. Reduced motion still switches off every animation and transition.

### Interactions (`interactions.cjs`)

| Check | Before | After |
| --- | --- | --- |
| Page movement while the mobile menu is open | scrolled 3,600 px | **0 px** |
| Mobile menu appearance | 0 ms, instant | **200 ms fade and lift, page under a scrim** |
| Page movement behind the sign-in dialog | 800 px per scroll | **0 px** |
| Value panel after tapping a card (phone, 664 px viewport) | top at 665–917 px, off-screen | **top at 113–335 px, in view** |
| Moments panel height across six tabs (phone) | 240–271 px, jumps 31 px | **271 px, steady** |
| Mega-menu and dialog opening | instant | **180–220 ms settle** |
| In-page anchors, FAQ deep links, demo form | sound | unchanged |

### Lifecycle reading column (D1)

Pixels of content hidden below the column's edge, for each of the six stages:

| Viewport | Before | After |
| --- | --- | --- |
| 1920 × 1080 | 0 | 0 |
| 1440 × 900 | card cut, action half visible | **0 in all six** |
| 1536 × 864 | cut | **0 in all six** |
| 1366 × 768 | cut | **0–26, edge fades** |
| 1280 × 720 | card action hidden | **12–70, action visible in stages 1–2, edge fades** |
| Phone | hard cut in every stage | scrolls inside the column, **edge fades** |

On short laptops and phones the column still holds more than fits. What changed is that the reader can now see that it continues and can scroll it. Making it fit fully on a phone would mean shrinking the model or splitting the column. That's a design decision, so it's left for the owner.

### What you can see

Before/after pairs in `screenshots/`:

| File | Finding |
| --- | --- |
| `A1-pressure-heading-phone.jpg` | A1: "pressureyou’re" restored to "pressure you’re", with a balanced heading |
| `A1-moments-intro-phone.jpg` | A1: "decisions.Follow" restored |
| `A3-value-stat-phone.jpg` | A3: "$10k" on one line |
| `A6-report-facts-phone.jpg` | A6: report figures on one baseline |
| `B1-footer-phone.jpg` | B1: footer hit areas (outlined) |
| `B3-mobile-menu-phone.jpg` | B3: menu over a scrim |
| `B4-value-tab-phone.jpg` | B4: the chosen panel in view |
| `B6-moment-tabs-phone.jpg` | B6: the tab row fades where it continues |
| `D1-lifecycle-1280x720.jpg`, `D1-lifecycle-1440x900.jpg`, `D1-lifecycle-phone.jpg` | D1, D2: the card fits; the legend clears the controls |
| `D3-lifecycle-landscape.jpg` | D3: compact header and a side-by-side story on a phone held sideways |

### Caveats

- **Scrolling smoothness isn't reported.** The browser runs headless with software WebGL, which exaggerates the 3D model's rendering cost. The frames-over-50 ms and long-task counts are in the raw JSON for comparison but aren't presented as results.
- **Some layout shift is intended movement.** CLS counts the lifecycle's scroll-linked motion as shift, even though the movement is deliberate. The "scroll" figures show how much movement went through layout; they aren't a count of surprises.
- **One regression was caught and fixed.** The first build's landscape fix (D3) let the hero shrink before its script ran, which pushed load-time shift at 200% zoom to 0.391. The final version keeps the original minimum height until the script has measured the screen, and three repeat runs measure 0.044.
