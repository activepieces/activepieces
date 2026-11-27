---
id: log-fields-are-now-grouped-by-entity
title: "Log fields are now grouped by entity"
added: '2026-06-18'
order: 1
release: 0.86.0
---

Log fields are now grouped under the entity they belong to, so each thing has one name. A flow run id is `flowRun.id` (it used to appear as `runId`, `flowRunId`, or a bare `id`), and other ids follow the same shape (`flow.id`, `project.id`, `job.id`, …). Errors are logged under `error`. This only changes how logs look — nothing about the API, database, or flows changes.

#### What you need to do

Only if you build dashboards or alerts on Activepieces logs. Update them to the new grouped names, e.g. `runId` → `flowRun.id` and `err` → `error`.
