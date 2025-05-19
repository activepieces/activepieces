import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const newWorkflowCreated = createTrigger({
  name: "new_workflow_created",
  displayName: "New Workflow Created",
  description: "Triggered when a new workflow is created",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    workflow_id: "123",
    name: "My New Workflow",
    created_at: "2024-03-20T12:00:00Z",
    created_by: "user123"
  },
  async onEnable(context) {
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
          event_type: "new_workflow_created",
        },
      });
    } catch (error) {
      console.error("Error enabling webhook:", error);
      throw new Error("Failed to enable webhook. Please check your authentication.");
    }
  },
  async onDisable(context) {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${COMFYICU_API_URL}/webhooks`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          webhook_url: context.webhookUrl,
          event_type: "new_workflow_created",
        },
      });
    } catch (error) {
      console.error("Error disabling webhook:", error);
      throw new Error("Failed to disable webhook. Please check your authentication.");
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