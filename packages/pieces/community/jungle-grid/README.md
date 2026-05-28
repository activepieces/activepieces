# Jungle Grid

Jungle Grid is an execution layer for AI agents and developers. It lets Activepieces workflows submit compute jobs, monitor status and logs, and retrieve artifacts without directly managing GPU providers or long-running infrastructure.

## Async workflow

Use this piece as an async-first workflow:

1. **Estimate Job** to preview cost, duration, and resource requirements.
2. **Submit Job** to enqueue work and return `job_id`, `status`, and metadata immediately.
3. **Get Job Status** and **Get Job Logs** in later steps, usually after a Delay or branch.
4. **List Artifacts** and **Get Artifact Download URL** after the job completes.

## API surface

This piece uses the current Jungle Grid job API:

- `POST /v1/jobs/estimate`
- `POST /v1/jobs`
- `GET /v1/jobs/{job_id}`
- `GET /v1/jobs/{job_id}/logs`
- `GET /v1/jobs/{job_id}/artifacts`
- `POST /v1/jobs/{job_id}/artifacts/{artifact_id}/download`
