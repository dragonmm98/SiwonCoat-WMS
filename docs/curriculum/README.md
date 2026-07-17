# Jably WMS — Teaching Curriculum

A 10-day, hands-on course for building the Jably WMS. Three self-contained HTML
documents — open them in any browser (they are theme-aware and print-friendly).

| Document | Audience | Purpose |
| --- | --- | --- |
| [10-day-curriculum.html](./10-day-curriculum.html) | Instructor | The day-by-day plan: objectives, topics, labs, and deliverables. |
| [lab-workbook.html](./lab-workbook.html) | Student | Per-day worksheets with exact commands, file paths, steps, and checkpoints. |
| [architecture-reference.html](./architecture-reference.html) | Student | Full context: overview, architecture, all enums, the complete database data dictionary, state machines, and roadmap. |

## How the course is structured

Ten full days taking intermediate developers through the complete inventory
lifecycle — **receive → putaway → allocate → pick → pack → ship** — building on
this repository. Days 5–6 (the transactional inventory kernel) are the crux.
Days 7–8 have students build features not yet in the repo (receipt posting and
FIFO/FEFO allocation).

The reference document is generated from the real
[`schema.prisma`](../../packages/database/prisma/schema.prisma) and the API
modules under [`apps/api/src`](../../apps/api/src); if the schema changes,
update the data dictionary to match.
