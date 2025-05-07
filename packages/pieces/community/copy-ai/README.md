# Copy.ai

Copy.ai helps teams automate content creation, research, and outreach using pre-built AI workflows. This piece allows you to integrate Copy.ai's workflow capabilities into your Activepieces flows.

## Actions

### Run Workflow
Start a predefined workflow by submitting inputs and receive a run ID to track progress. Optionally wait for the workflow to complete and get the results directly.

### Get Workflow Run Status
Check if a workflow is still running, completed, or failed. This action provides detailed status information about a workflow run.

### Get Workflow Run Outputs
Fetch the results (text, data) generated from a completed workflow run. This action can wait for the workflow to complete if it's still running.

## Triggers

### Workflow Run Completed
Triggered when a workflow run is completed. This allows you to automatically process the generated outputs from Copy.ai workflows.

## Authentication

To use this piece, you'll need a Copy.ai API key:

1. Make sure you have the Workspace Owner role or Workspace Admin role in Copy.ai
2. Log into your Copy.ai account
3. Click on **Workflows** in the left sidebar
4. Click on any Workflow you have
5. Click on the **API** tab
6. Copy your **WORKSPACE API KEY**

## API Reference

For more information about the Copy.ai API, visit the [Copy.ai API Documentation](https://docs.copy.ai/).
