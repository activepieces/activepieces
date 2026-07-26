---
icon: ⚙️
---

# Gotcha: system-job "No handler" = worker running the wrong edition

The single shared `system-job-queue` (BullMQ) is consumed by whatever app instance runs `startWorker()` (`app.ts`, gated only by `!IS_CANARY_APP`). Handlers are registered per-module as that instance boots — and **EE handlers only register in the CLOUD/ENTERPRISE branches of the edition switch**. So if the worker instance runs a different edition than the instance that *scheduled* the job, the job fires with no handler and throws `No handler for job <name>` every tick.

**Symptom seen (July 2026):** ~14.6k failed system jobs, ~99% `chat-stale-sweep` failing every minute with `No handler`. Root cause: the worker instance defaulted to **community** edition (`AP_EDITION` unset → `ApEdition.COMMUNITY`, `system.ts`), so `chatModule` never registered there — while a cloud instance kept creating the every-minute scheduler. Tell-tale: CE-edition jobs (`file-cleanup-trigger`) run fine on that same worker; every EE-scheduled job (`chat-stale-sweep`, deprecated `expire-pending-sso-domains`) fails identically.

**Fix:** set `AP_EDITION=cloud` (or `ee`) on the tier running the system-job worker so it loads the EE modules the deployment expects. This keeps chat/SSO strictly EE-gated (a genuine `ce` deployment still gets no chat) — it just stops a worker from silently running as community inside a cloud deployment.

**Why the number looked huge:** `removeOnComplete: true` deletes successes instantly, so the queue only ever *shows* failures; `removeOnFail` has an age cap (1 month) but **no count cap**, so a per-minute failure balloons. Registering the handler in all editions would also fix it but runs an EE maintenance job (harmless 0-row UPDATE) in CE and dents the edition boundary — prefer the deployment fix.

Inspect live via the DevOps box (`/root/queue`): a small read-only BullMQ script over SSH reading `getJobCounts()`, `getFailed()` (group by `failedReason`), and `getJobSchedulers()`.
