import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { OpenPhoneAuth } from '../common/auth';

export const incomingCallCompleted = createTrigger({
  auth: OpenPhoneAuth,
  name: 'incomingCallCompleted',
  displayName: 'Incoming Call Completed',
  description: '',
  props: {},
  sampleData: {
    id: 'call_123456',
    direction: 'inbound',
    phoneNumberId: 'pn_123456',
    from: '+15551234567',
    to: '+15559876543',
    status: 'completed',
    duration: 90,
    voicemailUrl: 'https://voicemails.openphone.com/vm_123456.mp3',
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:31:30Z',
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
          events: ['call.completed'],
          description: 'Call Completed Trigger',
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

    if (
      payload?.event === 'call.completed' &&
      payload?.data &&
      payload.data.direction === 'incoming'
    ) {
      return [payload.data];
    }

    return [];
  },
});
