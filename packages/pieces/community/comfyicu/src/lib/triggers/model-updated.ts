import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const modelUpdated = createTrigger({
  name: "model_updated",
  displayName: "Model Updated",
  description: "Triggered when a model is updated",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    model_id: "model_123",
    name: "Updated Model",
    version: "2.0.0",
    updated_at: "2024-03-20T12:00:00Z",
    changes: {
      description: "Updated model description",
      parameters: {
        new_parameter: "value"
      }
    }
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
          event_type: "model_updated",
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
          event_type: "model_updated",
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