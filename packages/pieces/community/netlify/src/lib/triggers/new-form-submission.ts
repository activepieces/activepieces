import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../common/auth";

export const newFormSubmission = createTrigger({
  name: "new_form_submission",
  displayName: "New Form Submission",
  description: "Fires when a Netlify form submission is received",
  auth: netlifyAuth,
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to monitor for form submissions",
      required: true,
    }),
    formId: Property.ShortText({
      displayName: "Form ID (Optional)",
      description: "The specific form ID to monitor. Leave empty to monitor all forms on the site",
      required: false,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: "submission_id_123",
    number: 1,
    title: null,
    email: "user@example.com",
    name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    company: "Example Corp",
    summary: "Contact form submission",
    body: "Hello, I would like to get in touch.",
    data: {
      email: "user@example.com",
      name: "John Doe",
      company: "Example Corp",
      message: "Hello, I would like to get in touch.",
      ip: "192.168.1.1",
    },
    created_at: "2023-01-01T00:00:00Z",
    site_url: "https://example.netlify.app",
  },
  async onEnable(context) {
    const webhookBody: any = {
      site_id: context.propsValue.siteId,
      type: "url",
      event: "submission_created",
      data: {
        url: context.webhookUrl,
      },
    };

    if (context.propsValue.formId) {
      webhookBody.form_id = context.propsValue.formId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://api.netlify.com/api/v1/hooks",
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: webhookBody,
    });

    if (response.status === 201) {
      await context.store.put("form_submission_webhook_id", response.body.id);
    } else {
      throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get("form_submission_webhook_id");
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${webhookId}`,
        headers: {
          "Authorization": `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete("form_submission_webhook_id");
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
