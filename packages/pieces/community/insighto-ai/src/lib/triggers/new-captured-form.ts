import {
  createTrigger,
  TriggerStrategy,
  Property,
} from "@activepieces/pieces-framework";

import { HttpMethod } from "@activepieces/pieces-common";
import { InsightoAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const newCapturedForm = createTrigger({
  auth: InsightoAuth,
  name: "newCapturedForm",
  displayName: "New Captured Form",
  description: "Triggers when a new form submission is captured in Insighto.ai",
  type: TriggerStrategy.WEBHOOK,
  props: {
    // Optional: if API allows selecting a specific form
    formId: Property.ShortText({
      displayName: "Form ID",
      description: "Capture submissions from this specific form (optional)",
      required: false,
    }),
  },
  sampleData: {
    id: "form_sub_12345",
    form_id: "form_67890",
    submitted_at: "2025-09-15T12:00:00Z",
    fields: {
      name: "John Doe",
      email: "john@example.com",
      phone: "16501111234",
    },
  },
  async onEnable(context) {
    // Register webhook with Insighto.ai
    const body: Record<string, unknown> = {
      name: "Activepieces - New Captured Form",
      endpoint: context.webhookUrl,
      enabled: true,
      form_id: context.propsValue.formId ?? undefined,
    };

    const webhook = await makeRequest(
      context.auth,
      HttpMethod.POST,
      "/outbound_webhook",
      body
    );

    // Save webhook ID so we can delete it later
    await context.store.put("webhookId", webhook.id);
  },

  async onDisable(context) {
    // Delete webhook when trigger disabled
    const webhookId = await context.store.get("webhookId");
    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/outbound_webhook/${webhookId}`
      );
    }
  },

  async run(context) {
    // Incoming webhook payload is in context.payload.body
    return [context.payload.body];
  },
});
