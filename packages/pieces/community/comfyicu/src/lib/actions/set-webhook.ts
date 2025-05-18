import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1/';

export const setWebhook = createAction({
  name: "set_webhook",
  displayName: "Set Webhook",
  description: "Set a webhook URL for workflow events",
  props: {
    webhook_url: Property.ShortText({
      displayName: "Webhook URL",
      description: "The URL to receive webhook events",
      required: true,
    }),
    event_type: Property.StaticDropdown({
      displayName: "Event Type",
      description: "The type of event to receive",
      required: true,
      options: {
        options: [
          { label: "Run Completed", value: "run_completed" },
          { label: "Run Failed", value: "run_failed" },
          { label: "Model Updated", value: "model_updated" },
          { label: "New Workflow Created", value: "new_workflow_created" },
        ],
      },
    }),
  },
  async run(context) {
    const { webhook_url, event_type } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${COMFYICU_API_URL}/webhooks`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        webhook_url,
        event_type,
      },
    });
  },
}); 