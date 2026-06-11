# Jungle Grid

Jungle Grid runs and monitors AI workloads on managed GPU capacity. Use this piece to upload job inputs, submit async workloads, monitor lifecycle/status/logs, retrieve artifacts, and cancel non-terminal jobs from an Activepieces workflow.

## Setup

1. Create or sign in to a Jungle Grid account at https://junglegrid.dev.
2. Generate a scoped API key in the Jungle Grid portal.
3. Add a Jungle Grid connection in Activepieces.
4. Paste the API key into the **API Key** field.
5. Keep **API Base URL** as `https://api.junglegrid.dev` unless Jungle Grid gives your workspace a custom endpoint.

Recommended API key scopes:

- `jobs:estimate` for Estimate Job.
- `jobs:submit` or `jobs:write` for Submit Job, Upload Job Input, and Cancel Job.
- `jobs:read` or `jobs:write` for List Jobs, Get Job Status, Get Job Events, logs, inputs, and artifacts.
- `logs:read` for Get Job Logs when not using `jobs:read`.

## Actions

- **Estimate Job**: previews routing, capacity source, and expected cost without starting compute.
- **Upload Job Input**: uploads an Activepieces file to Jungle Grid managed input storage and returns an `input_id`.
- **Submit Job**: queues a workload and returns immediately with job metadata. Supports `input_files`, `script_files`, `env`, `expected_artifacts`, templates, metadata, and `fine_tuning`.
- **List Job Inputs**: lists uploaded inputs, including IDs and mount paths.
- **List Jobs**: finds recent jobs and job IDs, optionally filtered by status.
- **Get Job Status**: reads current status, execution phase, scheduling delay, routing, failure, and artifact readiness details.
- **Get Job Events**: reads lifecycle events such as scheduling and startup events that can appear before workload logs exist.
- **Get Job Runtime**: reads runtime tails, exit code, and runtime availability details when available.
- **Get Job Logs**: fetches paginated workload and platform log entries.
- **List Job Artifacts**: lists files produced by a job.
- **Get Artifact Download URL**: creates a temporary signed URL for one artifact.
- **Cancel Job**: cancels a non-terminal job and may stop active execution.
- **Custom API Call**: calls Jungle Grid endpoints with the API base URL configured on the connection.

## Production Workflow

```text
Upload input/script
-> Submit job
-> Monitor events/status
-> Inspect logs
-> Retrieve artifacts
```

Recommended Activepieces flow:

1. Use **Upload Job Input** for datasets, inputs, or scripts.
2. Read the returned `input_id`.
3. Pass the ID into **Submit Job** as `input_files` or `script_files`.
4. Use **Get Job Events** for scheduling/startup lifecycle events or **Get Job Status** for current state.
5. Use **Get Job Logs** once workload logs begin.
6. Use **List Job Artifacts** and **Get Artifact Download URL** after the job completes.

## Example

Upload a script and submit it:

1. Add **Upload Job Input**.
2. Set **File** to a file from a previous step.
3. Set **Kind** to `script`.
4. Copy the returned `input_id`, for example `inp_script_123`.
5. Add **Submit Job**:
   - Job Name: `train-model`
   - Workload Type: `fine_tuning`
   - Container Image: `python:3.11`
   - Command: `python`
   - Arguments: `train.py`
   - Script Files: `inp_script_123`
   - Expected Artifacts: `/workspace/artifacts/model.bin`
6. Poll **Get Job Events** or **Get Job Status** with the returned `job_id`.
7. After completion, call **List Job Artifacts** and **Get Artifact Download URL**.

## Result Types

- **Lifecycle events** show platform progress such as acceptance, queueing, scheduling, provisioning, startup, retries, completion, failure, or cancellation. They are separate from workload logs and may appear first.
- **Job status** is the current state and metadata for the job, including phase and readiness signals.
- **Runtime details** describe runtime output tails, exit code, and runtime availability when available.
- **Workload logs** are paginated stdout/stderr/platform log entries.
- **Artifacts** are declared or produced output files that can be listed and downloaded with temporary signed URLs.

## Links

- Website: https://junglegrid.dev
- Docs: https://junglegrid.dev/docs
- MCP server: https://github.com/Jungle-Grid/mcp-server
- Discord: https://discord.com/invite/kpJqxXFFCs
