# entangl.com: original and refined

A self-contained folder, ready to move into its own repository. The content and brand are Entangl's and are mirrored here with the owner's authorisation.

| Folder | What it is |
| --- | --- |
| `v_original/` | Byte-for-byte mirror of entangl.com as served on 14 October 2026: all 28 pages, every asset, the 18 MB outage report, `robots.txt`, `sitemap.xml`, `_headers` and the custom 404. |
| `v_improved/` | The same site with the fixes from the audit applied. Same pages, words, layout, palette and interactions; the friction is removed. |
| `analysis/AUDIT.md` | What was measured, in which scenarios, every finding with its evidence, and the before/after numbers. |
| `analysis/screenshots/` | Before/after pairs for the fixes you can see. |
| `tools/` | The scripts used to mirror, serve, verify and audit the site. They can be rerun against any deployment. |

## Run it

The live host serves clean URLs with trailing slashes (`/platform` redirects to `/platform/`, which serves `platform/index.html`), a custom 404 page and the rules in `_headers`. `tools/serve.py` reproduces that routing exactly, so the mirror behaves locally as it does on entangl.com:

```bash
python3 tools/serve.py v_original 8000   # http://localhost:8000
python3 tools/serve.py v_improved 8001   # http://localhost:8001
```

Every path is root-absolute (`/assets/site.css`), so each version must be served from the root of its own origin, not from a subfolder.

## Deploy it

Either folder deploys as-is to any static host that uses directory-index routing:
- **Cloudflare (Pages or Workers static assets):** this is what entangl.com runs on, and it honours `_headers`.
- **Netlify:** honours `_headers`.
- **Vercel or GitHub Pages:** both work, but they ignore `_headers`. Its only rules are `noindex` on the report and thank-you pages, and a download filename for the PDF.

## How faithful the mirror is

`tools/mirror.py` crawled the sitemap, every link, every CSS `url()` and every asset path referenced inside the JavaScript. Then `tools/compare.cjs` loaded all 29 URLs (the 28 pages plus `/404`) on the live site and on the mirror, on phone, tablet and laptop (87 pairs):

- **Rendered text:** identical in all 87.
- **Failed requests and console errors:** zero on both.
- **Pixels:** 86 of 87 full-page screenshots are pixel-identical. The 87th (`/experience/` on phone) differs in 0.001% of its pixels, the same amount the live site differs from itself between two loads, because that region is an animated canvas.

One thing was deliberately left out. Cloudflare injects a bot-management `<script>` into every HTML response, with a token that changes on each request. It isn't part of the site's source, and Cloudflare adds it again when the folder is deployed behind it.

## What changed in v_improved

The full list, with reasons and measurements, is in `analysis/AUDIT.md`. In short:

- **Reading:**
  - Words no longer run together on phones ("pressureyou’re", "decisions.Follow").
  - Headings no longer end on a lone word.
  - "$10k" no longer breaks across lines.
  - Secondary text meets AA contrast.
  - No interface label is below 12 px.
  - The outage report's figures share a baseline.
- **Touch:**
  - Footer links, the menu button, the header button and the 3D controls have thumb-sized targets.
  - Taps get a pressed state.
  - The mobile menu fades in over a scrim, and the page behind it holds still.
  - Choosing a value card on a phone brings its panel into view.
  - The moment tabs fade at the edge that has more and stop jumping in height.
  - The page holds still behind the sign-in dialog.
- **Motion:**
  - The mega-menu, dialog and swapped content settle in instead of cutting.
  - The 3D model no longer drops into place after first paint.
  - The lifecycle stage buttons move without forcing layout on every frame.
  - All motion still switches off with reduced motion.
- **Short and sideways screens:**
  - The lifecycle story's interactive card fits on 1440 × 900 and 1536 × 864 laptops (it was cut off).
  - What can't fit on shorter laptops and phones fades at the edge so it's clearly scrollable.
  - The scene legend no longer runs under the camera controls.
  - A phone held sideways gets a compact header and a side-by-side story with a model it can actually show.

How it's built:
- Changes that layer on top of the original are in two new files, `v_improved/assets/refinements.css` and `refinements.js`, loaded last on the 27 pages that use the site stylesheet. Each rule names the finding it fixes.
- Changes that had to be made at the source are small and commented:
  - a space before four `<br>`s (in `index.html`, `lifecycle/index.html`, `platform/review/index.html` and `assets/platform-pages.js`)
  - `assets/site.js`: the moments panel keeps its tallest height and settles in new text
  - `assets/lifecycle-hero.js`: composited stage buttons and the landscape layout
- `/experience/` (an embeddable demo with its own styles) and the email preview are unchanged.

Diff the two folders to see every line:

```bash
diff -ru v_original v_improved
```

## Things to know before moving it

- **The forms are live.** `/demo/`, `/outage-report/` and the `/experience/` booking form post to `formsubmit.co` for `shapol@entangl.ai`. A deployed copy, or a local one, sends real enquiries if someone submits. The audit tools block those requests.
- **The contact script names an old host.** When the page isn't on `entangl.com`, `assets/contact-form.js` tells FormSubmit to send people back to `entangl-living-facility-customer-first.entangl-0263.chatgpt.site`. That's original behaviour and kept as-is, but it's worth updating once the site has a new staging host.
- **`_headers` is publicly readable.** The live site serves `/_headers` as a downloadable file. The mirror reproduces that. It's harmless, but most hosts hide the file.

## Tools

Python 3 and Node 18+; the browser tools need Playwright (`npm i -D playwright`).

| Script | Does |
| --- | --- |
| `mirror.py OUT` | Crawl entangl.com into `OUT`. |
| `serve.py DIR [PORT]` | Serve a folder with entangl.com's routing. |
| `compare.cjs A B OUT` | Text, request, error and pixel comparison of two deployments. |
| `audit.cjs BASE OUT` | The measurements behind the audit, across 10 device scenarios. |
| `interactions.cjs BASE [OUT.json]` | Scripted checks of the menu, dialog, tabs, anchors and forms. |
| `storyboard.cjs BASE OUT` | What a reader sees while scrolling, as contact sheets. |
| `before-after.cjs A B OUT` | The side-by-side images in `analysis/screenshots/`. |
