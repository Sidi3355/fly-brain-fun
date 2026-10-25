# A note before designing

Written after reading every page of entangl.com (the copy in `entangl/v_original`), including the
content that lives in its scripts: the six lifecycle moments, the six pressures, the platform
demos, the calculators and the 3D facility's captions.

## What Entangl is

A San Francisco company building AI for data center engineering and operations.

- **Today (core):** writing and reviewing procedures (MOPs, SOPs, EOPs) grounded in the site's
  own information: one-line drawings, equipment manuals, sequences of operation, site rules and
  templates. The site model is the context that makes those drafts and reviews specific.
- **Scoped with each deployment:** fieldwork and training on a tablet, AI telemetry, customer
  and audit visibility.
- **Planned:** maintenance planning, portfolio performance, design review and handover,
  vendors and RFPs.
- **Direction:** the operating system for a facility's whole life, from design and handover
  through operations, incidents and changes of operator to growth and proof.
- It also publishes research: a 52-page annual report on how data center outages escalate.

## Who it is for

The people responsible for critical facilities: owners and operators, tenants and their customer
teams, facilities-management providers, and development and engineering teams. Around them sit
IT, security, procurement and a budget holder.

They live in controlled documents: one-lines, O&M manuals, MOPs, work orders, witness records,
permits, registers. Mistakes have physical consequences, so they trust provenance, revision
control and clear authority, and they distrust software that sounds certain.

## What it believes

1. **The work is connected, and the information should be too.** The drawing, the manual, the
   procedure, the person, the part and the record belong to the same job. The problem isn't a
   lack of information; it is that the information lives in different places.
2. **Every fact keeps its provenance.** A drawing records an arrangement. A field check records
   an observation. Telemetry records a measurement, with a timestamp. None of them is the
   others. "A documented path is not a verified operating condition."
3. **People decide.** A software finding, an engineer's review and an authorization to work are
   separate events. "A review is not an approval." Generating a procedure authorizes nothing.
4. **Claim only what you can show.** Statistics carry their source and sample. Examples are
   labelled illustrative. There is no ROI figure, and "Entangl has no verified premium-reduction
   benchmark." Missing data stays missing: "shown as a gap, not as zero."
5. **Prove it on real work.** One site, one workflow, your baseline, your criteria, the full
   cost, and an agreed point at which to stop.
6. **Knowledge should survive handovers.** A site is designed by one group, built by another and
   run by people who inherit the decisions.

Their own standard: *Make the work clear. Show the evidence. Respect the judgment of the people
responsible for the site.*

Voice: plain, exact, second person, short declaratives, never breathless. "Bring us a task your
team knows well."

## What that means for the design

The audience already has a format for trust: the issued drawing set. It is controlled, numbered
and revised. Every sheet says what it is, what revision it is at, who drew it and what status it
has. References point to other sheets, notes carry the caveats, revision clouds mark what changed,
and nothing is approved until the right person signs.

That is also Entangl's product idea. It connects references across drawings, manuals,
procedures, people, parts and records, catches a Rev B that should be Rev C, and keeps the
decision with the engineer.

So the site will be **issued for review**: one controlled set of sheets.
- Every page is a sheet with a title block that holds the navigation, sheet number, revision and
  status.
- Every product area is drawn in the line style of its real availability: solid for core, light
  for scoped and dashed for planned.
- Claims carry note references you can follow to the source.
- The interactive proofs are details and calculations drawn on the sheet.
- Approval is left to "your authorized people", in writing, on every page.
