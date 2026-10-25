# Entangl, redesigned

The original site with a new visual design. The content is unchanged: every page has the same
words, sections, links, images and interactions as `../v_improved` (the original plus earlier bug
fixes). The rendered text, links, images and titles of all 29 pages were checked against the
original and match.

## What changed

Only how it looks:

- **Type:** one typeface (Inter, self-hosted) instead of a sans plus a monospace, with a stricter
  scale and tighter headings.
- **Colour:** white and soft grey surfaces instead of tinted green panels. The dark green is kept
  for the hero, the product demos and the closing call to action; lime marks the one thing to do
  next.
- **Surfaces:** rounded panels and soft shadows instead of outlined boxes.
- **Controls:** pill buttons, segmented toggles and native-feeling sliders.
- **Navigation:** a slimmer, translucent header.
- **Phones:** where the original hid line breaks and ran words together ("operationfeel"), the break
  is kept.

Motion still switches off under the system's reduced-motion setting and the site's own
*Reduce motion* switch.

## Forms are disconnected

The demo, site-session and report forms validate, then show the original's own message ("This form
isn't ready to deliver requests. Your details are still here.") with its email fallback. Nothing is
posted to FormSubmit or anywhere else, with or without JavaScript. The build fails if a FormSubmit
address is left in any page or script.

The connected-facility page still carries the original's privacy note saying entries are sent
through FormSubmit. That is accurate for the live site, and becomes accurate here again once the
forms are reconnected.

## Build

```sh
node build.mjs     # copies ../v_improved into ./site and applies the redesign
python3 ../tools/serve.py site 8202
```

- `src/redesign.css`: the whole redesign, loaded after the original stylesheets.
- `src/fonts/`: Inter (Latin and Latin Extended).
- `src/contact-form.js`, `src/outage-report.js`: the original form scripts with the sending removed.

Every page is `noindex` (meta tag, `X-Robots-Tag` header and `robots.txt`), so this preview never
competes with entangl.com in search results.

Deployed on Vercel from `site/` as the project `entangl-new`: https://entangl-new.vercel.app
