# Round 2: UI review

**The feedback after round 1:**

> It looks and feels the exact same as the original site. Things like overlapping icons and elements, no smooth transition between the numbered stages, etc.

That was right. Round 1 fixed friction you notice by using the site: unreadable text, missed taps, a menu that let the page scroll behind it. It left the two things you notice just by watching untouched: what happens between states, and what sits on top of what.

So round 2 measured those two things directly, on every page and device. It then rebuilt the site's motion and layering, keeping its words, palette, type and layout.

Same rule as round 1: everything here is a refinement of the existing design, never a new one.

---

## 1. How it was measured

| Tool | What it checks |
| --- | --- |
| `tools/overlaps.cjs` | **Element collisions on every page.** For all 26 pages on 7 devices, it scrolls as a reader would and, on the homepage, stops at every lifecycle stage. It flags any text, icon or control whose *visible* box collides with another, and text cut off by a clipping box. It only counts what is actually drawn: closed accordions and content scrolled out of an inner scroller don't count. A planted overlap is caught; a clean page reports zero. |
| `tools/model-overlaps.cjs` | **Collisions inside the 3D scene, which a DOM scan can't see.** It records where the effects canvas draws each label and compares those boxes with the clickable pins and their dots, the camera controls, the legend and the drag hint. It also measures what share of the controls and legend is drawn over the model, using pixels. Checked in the hero and at all six stages, on six devices. |
| `tools/transitions.cjs` | **Whether a change cuts or transitions.** It records every painted frame (DevTools screencast) while a state changes, then measures how the change is spread over time. A *cut* puts more than 70% of the change into one frame. A *transition* spreads it. Eleven state changes, across the homepage, platform, proof, answers and lifecycle pages. |
| Two code inventories | Every user-triggered state change in the pressure lab and the platform demos: what it changes in the DOM, and whether anything animates it. |

---

## 2. Findings

### The numbered stages cut (U1)

The homepage's lifecycle story has six numbered stages. Each change:
- swaps the reading column's content in a single frame;
- leaves the column **blank for a frame**, because the new content starts at opacity 0;
- fades the new content up over 240 ms;
- jumps the filled rail between nodes;
- swaps the counter in place.

Scrolling between stages is dead travel followed by a snap. The frame strip `screenshots/round2/frames-stage-scroll-laptop-before.jpg` shows it.

### The 3D scene's labels, pins and chrome collide (U2, U3)

| Device | Labels on pins or their dots (round 1) | Controls or legend drawn over the model (round 1) |
| --- | --- | --- |
| Phone | all 6 stages, up to 51 × 25 px | 18–22% of the control bar |
| Phone, landscape | 4 of 6 stages | up to 21% |
| Tablet | 3 of 6 stages | up to 11% |
| 1280 × 720 | 2 stages | controls up to 26%; legend up to 47%, over the floor |
| 1440 × 900, 1920 × 1080 | stage 5 | up to 4% |

On a small phone (320 px wide), pin labels also sat on each other and on dots at stages 1 and 4 (the page-wide scan in section 4).

The causes:
- **Labels and pins don't know about each other.** Canvas labels only avoid other labels. The clickable pins are placed independently and know about nothing.
- **The model fills its full height.** It is fitted to 94% of its area and centred, so its floor runs under the controls along the bottom edge.
- **The legend sits on the floor.** It is centred across the model at the bottom.

On a phone held sideways, the camera buttons also sat on the hero's subtitle before the story began.

### Nothing in the demos moves; everything is rebuilt (U4, U9)

The platform demos and most of the pressure lab rebuild their markup on every click. That has four costs:
- **Transitions never play.** Brand-new elements have no previous state to transition from. Four transitions declared in `pressure-lab.css` never run, and neither does the one for the platform's choice buttons.
- **Scroll positions reset.** Inner scrollers jump back to the start on every click; on a phone the selection ends up off-screen.
- **Focus is lost.** It falls to the page when the focused control is rebuilt.
- **Every state change is a hard cut.**

### Accordions, panels and the camera jump (U5, U6, U11)

- **Accordions:** every `<details>` (answers, platform FAQs, sources, form extras, the mobile menu's groups) snaps open.
- **Panels:** swapped panels jump to their new height, moving everything below.
- **Camera:** the rotate and zoom buttons jump 0.12 rad (about 7°) per press.

### Swapped content blinks (U10)

Round 1 faded swapped panels in from opacity 0. The old content still left in one frame, so the review panel went blank before the new one arrived (`frames-review-tab-laptop-before.jpg`).

### The page doesn't respond to reading or pointing (U7, U8)

- Sections are simply there; nothing marks arrival.
- Arrows on links don't lean toward where they go.
- Buttons don't answer a press.

### Bugs found along the way

| Bug | Where | Measured |
| --- | --- | --- |
| Searching answers for "copy", "link" or "answer" matches every question, because the search reads the "Copy a link to this answer" button | `/answers/` | "copy" matches 13 of 13 |
| Tracing CRAH-02 leaves Hall 02 dimmed although the text says "Hall 02 is connected". It sits in a group dimmed to 28%, and group opacity multiplies | homepage, pressure lab | visual |
| A finding you just selected loses its colour while the pointer is over it, because the hover rule outranks the selected rule | `/platform/review/` | visual |
| The calculator keeps its amber "negative" colour after an input is cleared | `/evaluate/` | amber "—" |
| Recording the example review decision scrolls the page | `/proof/example/` | 18 px |
| In-page links to the platform demo and questions land about 194 px below the top. Two offsets add up (106 px and 88 px) | platform pages | ~194 px |
| On phones, "CRAH-02" overflows its box, the chart's "200"/"400" ticks run into the plot, and time-bar labels are clipped | homepage, pressure lab | visual |

---

## 3. What changed

The motion language throughout:
- one easing, the site's own `--ease`;
- 160–420 ms for content;
- 250 ms for state colours;
- 700 ms for arrivals;
- direction-aware where there is a direction;
- everything switched off by the site's existing reduced-motion rules (the OS setting and the footer toggle).

| # | Change | Where |
| --- | --- | --- |
| U1 | **Stages hand over.** The outgoing copy lifts away as a ghost while the new copy settles in from the direction of travel: heading, then list, then card. The rail fills *continuously* with scroll and arrives at the next number as that stage takes over, smoothly through a click-jump too. Nodes change colour softly; the counter rolls; the stage name and status line fade. | `lifecycle-section.js` `handOver()`, `lifecycle-hero.js` rail, `refinements.css` U1 |
| U2 | **Labels and pins never sit on each other.** Every pin dot is registered as fixed (dots mark equipment). Each pin label then takes the first clear spot: right of its dot, left of it, or above or below it, with a hairline back to the dot. A pin keeps its spot while it stays clear, so nothing flickers as the camera moves. Canvas labels are placed around all pins, hairlines and labels from eleven candidate spots or, in a scene too crowded for any of them (a phone), the nearest clear spot. Labels fade in when they appear, and a label that has to change sides fades across instead of jumping. | `lifecycle-model.js` `updatePins()`, `placeLabel()`, `overlay()` |
| U3 | **Chrome stays off the drawing.** The model is fitted above a reserved band for the camera controls; on desktop the band eases in with the reading tools, so the model never jumps. The legend moves up beside the status line. On short landscape screens the camera buttons wait until the story begins. | `lifecycle-model.js` `chromeReserve()`, `refinements.css` U3 |
| U11 | **The camera eases.** Buttons and keys set where the camera is going and the view glides there, even while the scene is paused. Dragging stays direct. | `lifecycle-model.js` `easeCamera()` |
| U4 | **Platform demos patch in place.** The existing in-place patcher, previously used only for slider drags, now handles every redraw, with form values kept in sync. Pressed states, highlights, meters and chart lines transition. Inner scroll positions and focus survive. Only genuinely new content fades in. | `platform-pages.js` `draw()`, `refinements.css` U4 |
| U9 | **The pressure lab patches in place too**, so its own declared transitions finally play: routes dim, wires draw on, tiles and time bars resize. Also: Hall 02 lights when CRAH-02 is traced, labels fit on phones, chart ticks sit right-aligned beside the axis, cramped time-bar labels step aside, and focus rings no longer cover neighbours. | `pressure-lab.js` `morph()`, `refinements.css` U9 |
| U10 | **Swapped content dissolves.** A snapshot of the previous state fades out over the new content. Parts that didn't change stay perfectly still; only what changed visibly moves; there is never a blank frame. Used for review tabs, procurement, requirements, the platform scenes, the lifecycle card and the pressure lab's trace and group demos. It's skipped while a slider is dragged or text is typed. | `refinements.js` U10 |
| U5 | **Accordions open and close with their height**, with the content fading in. This includes the mobile menu's groups. | `refinements.js` U5 |
| U6 | **Swapped panels ease to their new height** (value panels, review, requirements, procurement, platform scenes, evidence card, calculator). | `refinements.js` U6 |
| U7 | **Sections arrive.** Section headings, their kickers and intro lines, and the pressure-index cards rise 16 px and fade in once as they come into view, with a short stagger. Anything on screen at load is left as is. | `refinements.js` U7 |
| U8 | **Pointer feedback.** Arrows lean toward where they go, external links lean up-right, text links firm their underline, and buttons answer a press. | `refinements.css` U8 |
| — | **Bugs fixed:** answers search, Hall 02, finding hover, calculator state, decision scroll, anchor offset. | `site.js`, `refinements.css` |

---

## 4. Results

### 3D scene (model-overlaps.cjs: hero plus six stages, per device)

| Device | Collisions, round 1 | Collisions, round 2 | Drawing under controls or legend, round 1 | Round 2 |
| --- | --- | --- | --- | --- |
| Phone | 10 | **0** | up to 22% | **0%** |
| Phone, landscape | 6 | **0** | up to 21% | **0%** |
| Tablet | 3 | **0** | up to 11% | **0%** |
| 1280 × 720 | 2 | **0** | up to 47% | **0%** |
| 1440 × 900 | 1 | **0** | up to 4% | **0%** |
| 1920 × 1080 | 1 | **0** | 0% | **0%** |

Collisions here include the hairlines from moved pin labels to their dots: nothing crosses one.

### Element collisions on every page (overlaps.cjs: 26 pages × 7 devices)

| Device | Round 1 | Round 2 |
| --- | --- | --- |
| Phone, small (320 × 568) | 4: homepage pin labels on each other and on a dot (stages 1 and 4) | **0** |
| Phone, landscape (844 × 390) | 2: homepage camera buttons on the hero's subtitle | **0** |
| Phone, tablet, 1280 × 720, 1440 × 900, 1920 × 1080 | 0 | 0 |
| Text cut off by its box, any device | 0 | 0 |

That is 6 collisions to 0 across all 182 page views.

### Transitions (transitions.cjs)

Each cell gives how many painted frames the change is spread over, how long it takes, and the share of the whole change that lands in its biggest single frame. "Cut" means more than 70% of the change lands in a single frame. All three versions were measured with the same tool on the same machine.

| State change | Original | Round 1 | Round 2 |
| --- | --- | --- | --- |
| Lifecycle stage, by scrolling (laptop) | 6 frames, 224 ms, 32% | 5 frames, 202 ms, 26% | **12 frames, 590 ms, 14%** |
| Lifecycle stage, by scrolling (phone) | 11 frames, 179 ms, 16% | 10 frames, 186 ms, 18% | **31 frames, 885 ms, 11%** |
| Lifecycle stage, by clicking the rail | 5 frames, 265 ms, 26% | 5 frames, 230 ms, 20% | **13 frames, 603 ms, 14%** |
| 3D scene, rotate button | cut | cut | **4 frames, 987 ms, 32%** |
| Homepage moment tab | cut | 7 frames, 169 ms, 21% | **7 frames, 187 ms, 20%** |
| Homepage value tab | cut | 7 frames, 162 ms, 15% | **5 frames, 133 ms, 20%** |
| Answers accordion | cut | cut | **8 frames, 240 ms, 18%** |
| Platform demo, choose a path | cut | cut | **6 frames, 164 ms, 39%** |
| Platform demo, choose a node | cut | cut | **4 frames, 107 ms, 60%** |
| Proof page review tab | cut | cut: 83% in one of 5 frames | **6 frames, 148 ms, 29%** |
| Lifecycle page tab | cut: 70% in one of 2 frames | 2 frames, 561 ms, 70% | **12 frames, 1229 ms, 31%** |

Cuts (more than 70% of the change in one frame): original **8 of 11**, round 1 **5 of 11**, round 2 **0 of 11**.

Round 1's lifecycle page tab sits exactly on the line, still 70% in one frame. The stage changes in the original are fades, so they never count as cuts, but they start from a blank frame (`screenshots/round2/frames-stage-scroll-laptop-before.jpg`). The camera's time includes its long, barely visible settle: most of the turn happens in the first quarter of a second.

### Bugs (scripted checks, original → round 2)

| Check | Original | Round 2 |
| --- | --- | --- |
| Answers matching the search "copy" | 13 of 13 | **0 of 13** |
| Calculator after clearing a field that made the result negative | amber "—" | **neutral "—"** |
| Page movement on "Record this example decision" | 18 px | **2 px** |

### No regressions (audit.cjs: all 28 pages × 10 scenarios)

Round 1 → round 2, for every page in every scenario. Round 2 had to leave round 1's gains intact, and it does: every count is unchanged, there is no overflow and there are no errors.

| Scenario | Overflow | Max CLS load | Max CLS scroll | Tap < 24 px | Tap < 44 px | Text < 12 px | Contrast < AA | Orphans | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| phone-small | 0 | 0.000 | 0.000 → **0.002** | 60 | 616 | 139 | 340 | 58 | 0 |
| phone | 0 | 0.000 | 0.000 | 59 | 856 | 139 | 340 | 31 | 0 |
| phone-landscape | 0 | 0.000 | 0.019 → **0.010** | 69 | 1003 | 116 | 347 | 21 | 0 |
| tablet-portrait | 0 | 0.000 | 0.000 | 69 | 1001 | 117 | 347 | 22 | 0 |
| tablet-landscape | 0 | 0.011 | 0.013 → **0.009** | 67 | 1002 | 99 | 356 | 12 | 0 |
| laptop-small | 0 | 0.013 | 0.009 | 67 | n/a | 98 | 356 | 11 | 0 |
| laptop | 0 | 0.009 | 0.007 | 67 | n/a | 98 | 356 | 8 | 0 |
| desktop | 0 | 0.004 | 0.003 | 67 | n/a | 98 | 356 | 7 | 0 |
| wide | 0 | 0.002 | 0.002 → **0.001** | 67 | n/a | 98 | 356 | 7 | 0 |
| zoom-200 | 0 | 0.044 | 0.020 → **0.015** | 60 | n/a | 111 | 344 | 10 | 0 |

The only values that move are layout shifts while scrolling, all far below 0.1 (Google's threshold for "good"). Most fall slightly. One rises, on the small phone (0.000 → 0.002): a pin label changing sides of its dot to stay clear, which now fades across rather than jumping.

### Before and after, side by side

`screenshots/round2/` compares the original site (left) with round 2 (right):

| File | Shows |
| --- | --- |
| `U2-scene-phone-stage1.jpg`, `U2-scene-phone-stage4.jpg` | labels and pins clear of each other on a phone, the drawing clear of the controls |
| `U3-scene-1280x720-stage1.jpg`, `U3-scene-1440x900-stage5.jpg` | the legend beside the status line, labels placed around pins, the model above the controls |
| `D3-lifecycle-landscape.jpg` | a phone held sideways |
| `U9-pressure-trace-phone.jpg` | Hall 02 lit when CRAH-02 is traced, and "CRAH-02" inside its box |
| `U9-pressure-chart-phone.jpg` | tick labels beside the axis |
| `frames-*-before.jpg` / `frames-*-after.jpg` | the painted frames of a stage change, a review tab, a platform node and an accordion, with timestamps |

---

## 5. Deliberately left alone

- **Count-up numbers.** The large figures in the calculators are `<output>` elements, which screen readers announce. Animating their text would announce every intermediate value.
- **Slider thumbs on preset buttons.** The native range thumb can't transition. Faking it with a script tween would fight the user's own dragging.
- **Sliding indicators for segmented controls.** These would need a new element per control and a visual design decision about its shape, which is beyond polish.
