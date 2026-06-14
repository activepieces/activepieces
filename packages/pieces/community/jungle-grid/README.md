# Jungle Grid

Jungle Grid runs and monitors AI workloads on managed GPU capacity. Use this piece to estimate a workload, submit it for async execution, poll status/runtime/logs, retrieve artifacts, and cancel non-terminal jobs from an Activepieces workflow.

## Setup

1. Create or sign in to a Jungle Grid account at https://junglegrid.dev.
2. Generate a scoped API key in the Jungle Grid portal.
3. Add a Jungle Grid connection in Activepieces.
4. Paste the API key into the **API Key** field.
5. Keep **API Base URL** as `https://api.junglegrid.dev` unless Jungle Grid gives your workspace a different endpoint.

Recommended API key scopes:

- `jobs:estimate` for Estimate Job.
- `jobs:submit` or `jobs:write` for Submit Job and Cancel Job.
- `jobs:read` or `jobs:write` for List Jobs, Get Job Status, Get Job Runtime, logs, and artifacts.
- `logs:read` for Get Job Logs when not using `jobs:read`.

## Actions

- **Estimate Job**: previews route, capacity, queue, and cost signals without starting compute.
- **Submit Job**: queues a workload and returns immediately with job metadata.
- **List Jobs**: finds recent jobs and job IDs, optionally filtered by status.
- **Get Job Status**: reads the current status and details for a job.
- **Get Job Runtime**: reads runtime tails, exit code, and runtime availability details when available.
- **Get Job Logs**: fetches recent stdout, stderr, or combined log entries.
- **List Job Artifacts**: lists files produced by a job.
- **Get Artifact Download URL**: creates a temporary signed URL for one artifact.
- **Cancel Job**: cancels a non-terminal job and may stop active execution.

## Examples

Estimate before running:

- Workload Type: `batch`
- Container Image: `python:3.11`
- Model Size (GB): `1`
- Command: `python`
- Arguments: `-c`, `print(42)`
- Optimize For: `balanced`

Submit an inference workload:

- Workload Type: `inference`
- Container Image: `pytorch/pytorch:2.4.0-cuda12.1-cudnn9-runtime`
- Model Size (GB): `7`
- Job Name: `chat-infer`

Submit a batch workload:

- Workload Type: `batch`
- Container Image: `python:3.11`
- Model Size (GB): `1`
- Command: `python`
- Arguments: `-c`, `print(42)`
- Optimize For: `cost`

Monitor a job:

1. Use **Submit Job**.
2. Store `job_id` from the response.
3. Add a Delay step.
4. Use **Get Job Status**, **Get Job Runtime**, or **Get Job Logs** with `job_id`.
5. Repeat or branch until the job reaches `completed`, `failed`, `rejected`, or `cancelled`.

Retrieve logs and artifacts:

1. Use **Get Job Logs** with `job_id`, `Tail Lines`, and `Stream`.
2. After completion, use **List Job Artifacts**.
3. Use **Get Artifact Download URL** with `job_id` and `artifact_id`.
4. Treat the returned signed URL as temporary and sensitive.

Trigger Jungle Grid from an automation:

1. Start with any Activepieces trigger, such as a webhook, schedule, form submission, or new database row.
2. Use **Estimate Job** when the workflow needs a cost or capacity preview.
3. Use **Submit Job** to queue work.
4. Persist `job_id` in the downstream system or poll with Delay + **Get Job Status**.
5. Use runtime, logs, and artifacts actions to collect outputs for notifications, storage, or follow-up processing.

## Links

- Website: https://junglegrid.dev
- Docs: https://junglegrid.dev/docs
- MCP server: https://github.com/Jungle-Grid/mcp-server
- Discord: https://discord.com/invite/kpJqxXFFCs
