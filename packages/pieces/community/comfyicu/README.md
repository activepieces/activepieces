# ComfyICU Integration for Activepieces

This integration allows you to interact with ComfyICU's API through Activepieces. ComfyICU lets you run powerful AI image generation workflows in the cloud without managing any hardware.

## Features

### Actions
- Submit Workflow Run: Execute a workflow with specified parameters and inputs
- Get Run Status: Check the status of a submitted workflow run
- List Workflows: Retrieve available workflows for execution
- Get Run Outputs: Fetch generated images or videos from a completed run
- List Models: Retrieve available models for workflow execution
- Create Workflow: Upload a new workflow JSON to the platform
- Set Webhook: Define a webhook URL to receive run status updates
- Cancel Run: Interrupt an ongoing workflow execution

### Triggers
- Run Completed: Triggered when a workflow run is completed
- Run Failed: Triggered when a workflow run fails
- New Workflow Created: Triggered when a new workflow is created
- Model Updated: Triggered when a model is updated

## Setup
1. Get your API key from ComfyICU
2. Add the ComfyICU integration to your Activepieces instance
3. Configure the integration with your API key
4. Start building your workflows!

## Documentation
For more information about the ComfyICU API, visit [ComfyICU API Documentation](https://comfy.icu/docs/api).
