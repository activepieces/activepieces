import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const runCompleted = createTrigger({
  name: "run_completed",
  displayName: "Run Completed",
  description: "Triggered when a workflow run completes successfully",
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
    run_id: "run_456",
    status: "completed",
    completed_at: "2024-03-20T12:00:00Z",
    outputs: {
      image_url: "https://example.com/output.png"
    }
  },
  async onEnable(context) {
    const { workflow_id } = context.propsValue;

    try {
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
          event_type: "run_completed",
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