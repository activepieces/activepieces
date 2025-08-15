import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface Payload {
  event?: string;
  data?: unknown;
  [key: string]: unknown;
}

export const callRecordingCompleted = createTrigger({
  auth: OpenPhoneAuth,
  name: 'callRecordingCompleted',
  displayName: 'Call Recording Completed',
  description: '',
  props: {},
  sampleData: {
    id: 'WHabcd1234',
    userId: 'US123abc',
    orgId: 'OR1223abc',
    label: 'my webhook label',
    status: 'enabled',
    url: 'https://example.com/',
    key: 'example-key',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z',
    deletedAt: '2022-01-01T00:00:00Z',
    events: ['call.completed'],
    resourceIds: ['<string>'],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    try {
      const webhook = await makeRequest(
        context.auth,
        HttpMethod.POST,
        '/webhooks/calls',
        {
          url: webhookUrl,
          events: ['call.recording.completed'],
          description: ' Call Recording Completed Trigger',
        }
      );

      await context.store?.put('_webhook_id', webhook.id);
    } catch (error) {
      throw new Error(`Failed to create webhook: ${error}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('_webhook_id');

    if (webhookId) {
      try {
        await makeRequest(
          context.auth,
          HttpMethod.DELETE,
          `/webhooks/${webhookId}`
        );
      } catch (error) {
        throw new Error(`Failed to delete webhook: ${error}`);
      }
    }
  },
  async run(context) {
    const payload = context.payload.body as Payload;

    if (payload?.event === 'call.recording.completed' && payload?.data) {
      return [payload.data];
    }

    return [];
  },
});
