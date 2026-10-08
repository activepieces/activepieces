import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { resendProps } from '../common/props';
import { updateWebhookOutputSchema } from '../output-schemas';

export const updateWebhook = createAction({
  name: 'update_webhook',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Update Webhook',
  outputSchema: updateWebhookOutputSchema,
  description: "Update a webhook's endpoint, events, or status",
  audience: 'ai',
  aiMetadata: { description: 'Updates the endpoint URL, subscribed event types, or enabled/disabled status of an existing webhook, identified by ID. Only supplied fields change. Use this to pause a webhook (set status to disabled) without deleting it. Idempotent — re-applying the same values leaves the webhook unchanged.', idempotent: true },
  props: {
    webhook_id: resendProps.webhookId,
    endpoint: Property.ShortText({ displayName: 'Endpoint URL', required: false }),
    events: Property.Array({
      displayName: 'Events',
      description: 'Replaces the full set of subscribed event types. Leave blank to keep the current events.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.endpoint) body['endpoint'] = propsValue.endpoint;
    if (propsValue.events && (propsValue.events as string[]).length > 0) {
      body['events'] = propsValue.events as string[];
    }
    if (propsValue.status) body['status'] = propsValue.status;

    return await resendClient.sendRequest<{ object: string; id: string }>({ auth: auth.secret_text, method: HttpMethod.PATCH, path: `/webhooks/${propsValue.webhook_id}`, body: body });
  },
});
