import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { livesessionAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sessionEvent = createTrigger({
  auth: livesessionAuth,
  name: 'sessionEvent',
  displayName: 'Session Event',
  description: 'Triggered when a session event occurs in LiveSession',
  props: {
    website_id: Property.ShortText({
      displayName: 'Website ID',
      description: 'The website ID to listen for session events',
      required: true,
    }),
    api_version: Property.ShortText({
      displayName: 'API Version',
      description: 'API version (e.g., v1.0)',
      required: false,
      defaultValue: 'v1.0',
    }),
  },
  sampleData: {
    event: 'session_event',
    session_id: 'example-session-id',
    website_id: 'example-website-id',
    timestamp: 1234567890,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { website_id, api_version } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.livesession.io/v1/webhooks',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        url: context.webhookUrl,
        website_id,
        version: api_version,
      },
    });

    if (response.body.webhook_id === undefined) {
      throw new Error(`Failed to create webhook: ${response.body}`);
    }

    await context.store?.put('webhook_id', response.body.webhook_id);
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const webhook_id = await context.store?.get('webhook_id');

    if (!webhook_id) {
      return;
    }

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.livesession.io/v1/webhooks/${webhook_id}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    await context.store?.delete('webhook_id');
  },
  async run(context) {
    return [context.payload.body];
  },
});
