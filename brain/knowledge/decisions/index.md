---
title: Decisions
icon: ⚖️
---

# Decisions

One hard-to-reverse call per record, with the reasoning that produced it.

Each file in this folder is numbered, and the number is assigned once and never reused, so a link to a decision
stays good and the sequence tells you what came after what. Write the decision, the context it was made in, why
this option won over the alternatives, and what it commits you to. The why is the part that stops the same
argument being had again in six months, and it is the part nobody remembers without a record.

This folder is an ordinary folder. It has an `index.md` because every folder page does, and the decisions inside
it are its children. Nothing special-cases it.
- **Old flows move forward by re-pinning the version, never by re-packaging** — why re-bundling a pinned piece buys 12–25% and the version has to move instead
- **Operational metrics ride the log drain, not a metrics pipeline** — why Postgres/Redis gauges are wide events in ClickHouse instead of OTLP
