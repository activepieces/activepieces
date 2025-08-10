import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
interface Payload {
  event?: string;
  data?: unknown;
  [key: string]: unknown;
}

export const outgoingMessageDelivered = createTrigger({
  auth: OpenPhoneAuth,
  name: 'outgoingMessageDelivered',
  displayName: 'Outgoing Message Delivered',
  description:
    'Fires when an outgoing message is successfully delivered to the recipient.',
  props: {},
  sampleData: {
    id: 'msg_123456',
    direction: 'outbound',
    phoneNumberId: 'pn_123456',
    from: '+15559876543',
    to: '+15551234567',
    body: 'Hello, this is a test message',
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    try {
      const webhook = await makeRequest(
        context.auth,
        HttpMethod.POST,
        '/webhooks/messages',
        {
          url: webhookUrl,
          events: ['message.delivered'],
          description: ' Message Delivered Trigger',
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
          `/webhooks/${webhookId}`,
          undefined
        );

        await context.store?.delete('_webhook_id');
      } catch (error) {
        console.error(`Failed to delete webhook: ${error}`);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as any;

    if (payload?.event === 'message.delivered' && payload?.data) {
      return [payload.data];
    }

    return [];
  },
});
