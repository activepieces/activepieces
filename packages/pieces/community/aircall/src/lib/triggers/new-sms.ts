import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newSms = createTrigger({
  auth: aircallAuth,
  name: 'newSms',
  displayName: 'New SMS',
  description: 'Fires when a new SMS message is received',
  props: {},
  sampleData: {
    event: 'message.received',
    resource: 'message',
    timestamp: 1589609314,
    token: '45XXYYZZa08',
    data: {
      id: 12345,
      direction: 'inbound',
      body: 'Hello, this is a test SMS message',
      sent_at: '2023-07-31T10:30:00Z',
      from: '+1234567890',
      to: '+0987654321',
      number: {
        id: 123,
        name: 'Main Number',
        digits: '+0987654321',
      },
      contact: {
        id: 456,
        first_name: 'John',
        last_name: 'Doe',
        phone_numbers: [
          {
            id: 789,
            label: 'Mobile', 
            value: '+1234567890',
          },
        ],
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    

    const webhook = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events: ['message.received'],
      }
    );

    await context.store?.put('webhook_id', webhook.webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store?.get('webhook_id');
  

    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload.body as { event?: string };
    
    // Verify this is a message received event
    if (payload.event === 'message.received') {
      return [payload];
    }
    
    return [];
  },
});