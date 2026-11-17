import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_WEBHOOK_EVENT_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const createWebhook = createAction({
  auth: villageAuth,
  name: 'create_webhook',
  classification: 'WRITE',
  displayName: 'Create Webhook',
  description:
    'Register a URL that Village will POST your activity to (new connections, job changes, list and sequence events). The response contains the signing secret once; it is never returned again. Free.',
  audience: 'human',
  aiMetadata: {
    description:
      'Registers an outbound webhook URL for the caller\'s Village events; sends relationship data to that URL. Returns the HMAC signing secret once. Not idempotent: each call creates another webhook.',
    idempotent: false,
  },
  outputSchema: villageSchemas.createWebhook,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Public http(s) endpoint. Localhost and private IPs are rejected by Village.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    event_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Leave empty to receive every event type, including future ones.',
      required: false,
      options: { options: VILLAGE_WEBHOOK_EVENT_OPTIONS },
    }),
    secret: Property.ShortText({
      displayName: 'Signing Secret',
      description: 'Optional, at least 32 characters. Leave empty and Village generates one. Note: like any text input, this value appears in step inputs and logs.',
      required: false,
    }),
  },
  async run(context) {
    const { url, description, event_filter, secret } = context.propsValue;
    const body: Record<string, unknown> = { url: villageApi.requireText({ value: url, field: 'URL' }) };
    if (description) {
      body['description'] = description;
    }
    if (event_filter && event_filter.length > 0) {
      body['event_filter'] = event_filter;
    }
    if (secret) {
      if (secret.length < 32) {
        throw new Error('Signing Secret must be at least 32 characters.');
      }
      body['secret'] = secret;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/webhooks',
      body,
    });
  },
});
