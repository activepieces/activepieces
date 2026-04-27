# LangSmith Piece

## Overview

The LangSmith piece integrates [LangSmith](https://smith.langchain.com/) — LangChain's observability and evaluation platform — with Activepieces. It allows you to log LLM application traces, query run history, and add feedback to runs, all from your automation flows.

## Authentication

This piece uses an **API Key** for authentication.

**How to get your API Key:**

1. Go to [LangSmith](https://smith.langchain.com/) and sign in.
2. Click your profile icon (bottom-left) and select **Settings**.
3. Navigate to **API Keys** and click **Create API Key**.
4. Copy the key — it is only shown once.

When adding the LangSmith connection in Activepieces, paste this key into the **API Key** field. The connection is validated automatically.

## Actions

### Create Run

Log a new run (trace) to LangSmith. Use this to track LLM calls, chain executions, or tool invocations from your flows.

- **Run Name** (required) — A descriptive name (e.g. "Chat Pipeline").
- **Run Type** (required) — The category: Chain, LLM, Tool, Retriever, Prompt, Parser, or Embedding.
- **Inputs** (required) — JSON input data for the run.
- **Project Name** (optional) — The LangSmith project to log to. Defaults to your default project.
- **Parent Run ID** (optional) — Link this as a child of another run.

### List Runs

Query and filter runs in your LangSmith projects. Useful for monitoring, alerting on errors, or building reports.

- **Project Name** (optional) — Filter by project.
- **Run Type** (optional) — Filter by type (Chain, LLM, Tool, etc.).
- **Root Runs Only** (optional) — Only return top-level runs, excluding child spans.
- **Errors Only** (optional) — Only return runs that resulted in an error.
- **Limit** (optional) — Maximum results to return (default: 10).

### Create Feedback

Add a score, rating, or comment to a run. Use this for automated evaluation or human-in-the-loop review.

- **Run ID** (required) — The ID of the run (from List Runs).
- **Feedback Key** (required) — A label like "correctness" or "user-rating".
- **Score** (optional) — A numeric score (e.g. 0–1 or 1–5).
- **Value** (optional) — A categorical value (e.g. "correct", "incorrect").
- **Comment** (optional) — A text explanation.

### Custom API Call

Make any API request to the LangSmith REST API. Use this for endpoints not covered by the actions above.

## Triggers

### New Run

Fires when a new root-level run (trace) appears in LangSmith. Polls every 5 minutes. Use this to trigger alerts, sync data, or kick off downstream workflows when new LLM traces arrive.

## Example Use Cases

- **Error alerting:** New Run trigger → filter errored runs → send Slack notification.
- **Automated evaluation:** New Run trigger → call an LLM to evaluate output → Create Feedback with score.
- **Trace logging:** Receive a webhook from your app → Create Run to log the interaction in LangSmith.