import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newNumberCreated = createTrigger({
  auth: aircallAuth,
  name: 'newNumberCreated',
  displayName: 'New Number Created',
  description: 'Fires when a new number is created on your Aircall account',
  props: {},
  sampleData: {
    event: 'number.created',
    resource: 'number',
    timestamp: 1585601319,
    token: '45XXYYZZa08',
    data: {
      id: 123,
      name: 'Main Office Line',
      digits: '+1234567890',
      country: 'US',
      time_zone: 'America/New_York',
      created_at: '2023-07-31T10:30:00Z',
      open: true,
      priority: 1,
      messages: {
        welcome: 'Welcome to our company',
        waiting: 'Please hold while we connect you',
        voicemail: 'Please leave a message after the tone'
      }
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
        events: ['number.created'],
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
    
    // Verify this is a number created event
    if (payload.event === 'number.created') {
      return [payload];
    }
    
    return [];
  },
});