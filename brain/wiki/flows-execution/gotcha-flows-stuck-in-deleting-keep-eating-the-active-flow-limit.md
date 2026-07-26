---
icon: 🗑️
---

# Gotcha: flows stuck in DELETING keep eating the active-flow limit

Flow deletion is a durable BullMQ system job (`delete-flow-<flowId>`, queue `system-job-queue`), not synchronous. `delete()` sets `operationStatus=DELETING` and enqueues the job; the row + `status=ENABLED` only go away when the job finishes. The job runs `preDelete` → **`sampleDataService.deleteForFlow`**, which does `DELETE FROM file WHERE projectId=? AND type=? AND metadata->>'flowId'=?`.

**The trap:** `metadata->>'flowId'` had no index, so on the large prod `file` table it seq-scans and blows `statement_timeout`. The job exhausts its 2 attempts and lands **permanently** in the failed set — no more retries, no self-heal. The flow is left `status=ENABLED`+`operationStatus=DELETING`: hidden from the UI list (which filters `!=DELETING`) but **still counted by the active-flows quota** (`getUsage` counts `status=ENABLED` only). These accumulate to the plan's active-flow cap → Publish silently shows the "Purchase Extra Active Flows" dialog instead of publishing. This is what breaks the `webhook-should-return-response` e2e monitor (its cleanup delete stalls, flows pile up to 10/10).

Note: `preDelete` disables the trigger *before* the failing sample-data delete, so stuck flows are functionally dead (won't fire) — safe to force-delete their rows.

**Fixes (PR on `fix/flow-delete-sample-data-timeout`):** (1) partial expression index `idx_file_sample_data_flow_id` on `file (type, (metadata->>'flowId'))` for the two sample-data types — kills the timeout; (2) add `operationStatus != DELETING` to the active-flow counts in `platform-plan.service.ts getUsage` and `flow.service.ts countActiveFlowsByProjects` — decouples the quota from delete-job success.

Root: old query (~v0.34.1) + data growth = the timeout; durable-delete (`a76dd68f84`, Nov 2025) + quota-counts-ENABLED = why it wedges instead of erroring loudly.
