import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createWebhookOutputSchema } from '../output-schemas';

export const createWebhook = createAction({
  name: 'create_webhook',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Webhook',
  outputSchema: createWebhookOutputSchema,
  description: 'Create a webhook subscription for Resend events',
  audience: 'ai',
  aiMetadata: { description: 'Creates a webhook that sends real-time notifications to an endpoint URL for the selected Resend event types, returning its ID and a signing secret used to verify payloads. Store the signing secret immediately — it is only returned once, at creation. Not idempotent — each call creates a new webhook.', idempotent: false },
  props: {
    endpoint: Property.ShortText({
      displayName: 'Endpoint URL',
      description: 'The URL Resend will send event payloads to.',
      required: true,
    }),
    events: Property.Array({
      displayName: 'Events',
      description: 'Event types to subscribe to, e.g. email.sent, email.bounced, contact.created.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest<{ object: string; id: string; signing_secret: string }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/webhooks', body: { endpoint: propsValue.endpoint, events: propsValue.events as string[] } });
  },
});
