# Entangl, issued for review

A new website for Entangl, designed from [`NOTE.md`](NOTE.md) rather than from the existing site.
The content, facts, product scope and links come from the copy of entangl.com in `../v_original`.

## The idea

The site is an issued drawing set, the format the people who run critical facilities already
trust.

- **Every page is a sheet.** It has a number (`G-001`, `L-101`, `P-204`…), a revision and a
  status. The title block on the right holds the navigation, the sheet register and the
  approval line: *Approved for work: by your authorized people. Not by this website.*
- **Line weight shows what is real today.** Solid lines are core workflows, light lines are
  scoped with each deployment, and dashed lines are planned. The same rule applies everywhere:
  in the cover schematic, the lifecycle, the platform proofs and the sheet index.
- **Claims carry note references.** Statistics are numbered notes with their source and sample,
  collected in the General notes at the foot of each sheet.
- **The interactive proofs are drawn details.** The lifecycle is a floor plan of one fictional
  facility across six moments. The pressures are worked as *Given / Find / Solution*. The review
  example is a revision cloud. Buyer questions are an RFI log. The demo request is a
  transmittal. The pricing page is a schedule of items with no rate filled in.

## Sheets

| Group | Sheets |
| --- | --- |
| General | G-001 Cover · G-002 Who it's for · G-003 About · G-004 Book a site demo |
| Full lifecycle | L-101 The connected lifecycle · L-102 Design & handover · L-103 Vendors & RFPs · L-104 The connected facility |
| Platform | P-201 Overview · P-202 Site model · P-203 Write procedures · P-204 Review & approvals · P-205 Fieldwork & training · P-206 AI telemetry · P-207 Customer & audit visibility · P-208 Maintenance planning · P-209 Portfolio performance |
| Enterprise | E-301 Systems & integrations · E-302 Security & deployment · E-303 Implementation & support · E-304 Pricing & scope |
| Proof & research | R-401 Customer evidence · R-402 A procedure review example · R-403 Buyer questions · R-404 Plan an evaluation · R-405 Annual outage report |

Plus the report's thank-you and email pages and a 404 sheet (`X-000`).

## Changes from the original, on purpose

- The 3D facility became a 2D floor plan that changes across the six lifecycle moments.
- The value calculators moved to R-404 as four separate calculation sheets, each showing its
  working. They are never added together into one figure.
- **The forms are disconnected.** The demo, session and report forms validate, then say plainly
  that nothing was sent and offer the same details as an email. Nothing posts to FormSubmit.
- Every page is `noindex` (meta tag, `X-Robots-Tag` header and `robots.txt`), so this preview
  can't compete with entangl.com in search results.

## Build

No dependencies. Node 18 or later.

```sh
node build.mjs        # writes the site to ./site
cd site && python3 -m http.server 8201
```

- `src/pages/*.mjs`: one module per group of sheets.
- `src/parts/`: the lifecycle plan, the pressures and the platform pages (built from
  `src/data-platform.json`, extracted from the original).
- `src/sheets.mjs`: the sheet register (numbers, titles, statuses, revision).
- `src/layout.mjs` and `src/kit.mjs`: the sheet frame, the title block and the shared drawing
  parts.
- `src/assets/`: one stylesheet, small per-sheet scripts, self-hosted fonts (Archivo and IBM
  Plex Mono).

Motion follows the OS reduced-motion setting and the *Reduce motion* switch in every footer.

Deployed on Vercel from `site/` as the separate project `entangl-issued`.
