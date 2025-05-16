import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://api.comfyicu.com';

export const runFailed = createTrigger({
  name: "run_failed",
  displayName: "Run Failed",
  description: "Triggered when a workflow run fails",
  type: TriggerStrategy.WEBHOOK,
  props: {
    workflow_id: Property.ShortText({
      displayName: "Workflow ID",
      description: "The ID of the workflow to monitor",
      required: true,
    }),
  },
  sampleData: {
    workflow_id: "123",
    error: "Workflow execution failed",
    timestamp: "2024-03-20T12:00:00Z",
    details: {
      error_message: "Failed to process image",
      error_code: "PROCESSING_ERROR"
    }
  },
  async onEnable(context) {
    const { workflow_id } = context.propsValue;

    try {
      // Register webhook for this workflow
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${COMFYICU_API_URL}/webhooks`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          webhook_url: context.webhookUrl,
          workflow_id,
          event_type: "run_failed",
        },
      });
    } catch (error) {
      console.error("Error enabling webhook:", error);
      throw new Error("Failed to enable webhook. Please check the workflow ID and authentication.");
    }
  },
  async onDisable(context) {
    const { workflow_id } = context.propsValue;

    try {
      // Unregister webhook
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${COMFYICU_API_URL}/webhooks/${workflow_id}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error("Error disabling webhook:", error);
      throw new Error("Failed to disable webhook. Please check the workflow ID and authentication.");
    }
  },
  async run(context) {
    try {
      const payload = context.payload.body;
      if (!payload) {
        throw new Error("Payload is missing or invalid.");
      }
      return [payload];
    } catch (error) {
      console.error("Error processing webhook payload:", error);
      throw new Error("Failed to process webhook payload.");
    }
  },
});