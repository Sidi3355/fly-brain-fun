# Placeholders and things to confirm

Everything else on the site is filled from your GitHub repositories, your CV and the reports linked from it. These are the gaps, roughly in order of impact.

## Fill in

| What | Where | How |
| --- | --- | --- |
| **Headshot** | Section 1, "Fig. 1: the device, actual size" (currently a hatched "Photo TBD" box) | Add `public/images/headshot.jpg` (portrait, about 960×1200) and set `headshot: '/images/headshot.jpg'` in `src/data/profile.ts` |
| **arXiv link for Per the Spec** | `/work/per-the-spec`, research section | Add `{ label: 'Preprint (arXiv)', href: '…', kind: 'paper' }` to its `links` in `src/data/projects.ts` (there is a `TODO` there) |
| **Custom domain** (optional) | Vercel → Project → Domains | Then update `site` in `astro.config.mjs`, `profile.site` and `public/robots.txt` |

## Confirm

| What | Current text | Where |
| --- | --- | --- |
| What you are open to | "Open to: Research & engineering internships" | `profile.status` in `src/data/profile.ts` |
| Contact email | Your Imperial address, already public in the Per the Spec README | `profile.email` |
| Greenpower role | "Led the design of the school's car", from your personal statement | `greenpower` in `projects.ts` and the matching revision |
| Aramco F1 Challenge context | "COTA aerodynamic design criteria … Aramco F1 Challenge, 2025" | `cota-aero` in `projects.ts` |
| Big Bang award year | 2025 (from the IHEEM letter) | `revisions` and `awards` in `profile.ts` |

## Deliberately left out

- **Phone number and home town.** They are on your CV PDF, but this site is public. The `/cv` page is generated without them.
- **spidey** (the Tom Holland WebGL tribute). It's lovely shader work, but it's a fan piece, not professional or academic work. Add it as a `creative` project if you want it.
- **Private repositories are mentioned but never linked:** Neuronaut's source, autocal, Alfa Connectome, the IWM bot, COTA. Each says "Source private". Neuronaut's live site is linked.
- **Football and other interests** from your CV. If you want a human touch, the "Reading" status line already carries Gödel, Escher, Bach.
