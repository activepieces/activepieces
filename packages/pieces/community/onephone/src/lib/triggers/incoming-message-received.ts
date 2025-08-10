import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const incomingMessageReceived = createTrigger({
  auth: OpenPhoneAuth,
  name: 'incomingMessageReceived',
  displayName: 'Incoming Message Received',
  description: '',
  props: {},
  sampleData: {
    id: 'msg_123456',
    direction: 'inbound',
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
          events: ['message.received'],
          description: ' Message Received Trigger',
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
    const payload = context.payload.body as any;

    if (payload?.event === 'message.received' && payload?.data) {
      return [payload.data];
    }

    return [];
  },
});
