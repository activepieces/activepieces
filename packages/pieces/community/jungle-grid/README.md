# Jungle Grid

Jungle Grid is an execution layer for AI agents and developers. It lets Activepieces workflows submit compute jobs and monitor their status and runtime output without directly managing GPU providers or long-running infrastructure.

## Async workflow

Use this piece as an async-first workflow:

1. **Estimate Job** to preview cost, duration, and resource requirements.
2. **Submit Job** to enqueue work and return `job_id`, `status`, and metadata immediately.
3. **Get Job Status** in later steps, usually after a Delay or branch, to poll progress.
4. **Get Job Runtime** for runtime tails and exit information once the job is running or finished.

Use **List Jobs** to enumerate jobs for the workspace.

## API surface

This piece uses the current Jungle Grid job API:

- `POST /v1/jobs/estimate`
- `POST /v1/jobs`
- `GET /v1/jobs`
- `GET /v1/jobs/{job_id}`
- `GET /v1/jobs/{job_id}/runtime`
