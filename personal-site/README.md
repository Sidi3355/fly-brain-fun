# siddarth-oruganti.vercel.app

Personal website of Siddarth Oruganti, written as a component datasheet: the person is part **SO-26**, skills are pins on a 32-pin DIP, experience is the revision history, grades are electrical characteristics, and contact is ordering information. It comes in two finishes: **paper** (drafting paper and a vermilion redline) and **blueprint** (cyanotype and an amber pencil).

Static site, built with [Astro](https://astro.build), deployed on Vercel.

## What is on it

| Route | Content |
| --- | --- |
| `/` | Hero with a live ripple tank (2D wave equation on canvas), then sections 1–7 |
| `/work/<slug>` | One datasheet per project: key specs, figure, method, results, honest caveats, pins used |
| `/cv` | A one-page CV generated from the same data; prints to A4 |
| `/404` | Open circuit |

Interactive details: <kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> / <kbd>/</kbd> opens a command palette; the hero reacts to the pointer and to clicks; pins on the chip show which projects use each skill; project and history lists filter by type; the dimension line under the name measures it live.

## Where the content lives

All copy and numbers are in three typed modules. Edit these, not the components.

- `src/data/profile.ts`: name, links, bio, status, pins (skills), revision history, grades, awards
- `src/data/projects.ts`: every project and paper, with metrics, stack, links and the detail-page write-up
- `src/data/figures.ts`: data behind the Kalshi equity curve and the per-model gaming-rate chart

Every number traces back to a repository, paper or report. Two figures are drawn from real data; `scripts/figures/README.md` explains how to regenerate them. Things still to fill in are listed in [PLACEHOLDERS.md](PLACEHOLDERS.md).

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # astro check (TypeScript + templates)
npm run build     # static output in dist/
npm run preview   # serve dist/
npm run og        # re-render public/og.png and icons (needs Playwright + Chromium)
```

Node 22.23.4 or newer (Astro 7).

## Deploy

The Vercel project builds `main` on every push (`vercel.json` sets clean URLs, security headers including a CSP, and long-lived caching for hashed assets). Pull requests get preview URLs. If you add a custom domain, update `site` in `astro.config.mjs`, `profile.site` in `src/data/profile.ts`, and the sitemap line in `public/robots.txt`.

## Layout

```
src/
  components/      Hero, Figure (all line-art figures), cards, header, title block, palette
  components/sections/   the seven datasheet sections on the home page
  data/            content (see above)
  layouts/Base.astro     <head>, SEO, theme bootstrap
  pages/           index, work/[slug], cv, 404
  scripts/ripple.ts      the ripple tank
  styles/global.css      tokens for both themes, base styles
public/            favicon, OG image, manifest, robots, neuron figure
scripts/           OG renderer, figure-data extraction
```

## Accessibility and performance

Semantic landmarks, skip link, visible focus, keyboard-operable palette, pins and filters; `prefers-reduced-motion` stops the ripple tank and reveals. Checked with axe-core on every page type in both themes (no violations). About 3 KB of gzipped JavaScript, self-hosted variable fonts with only the Latin subset downloaded, no third-party requests.
