import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const TRIGGER_KEY = 'trigger_new-number'

export const newNumberCreated = createTrigger({
  auth: aircallAuth,
  name: 'newNumberCreated',
  displayName: 'New Number Created',
  description: 'Triggers when a new number is created.',
  props: {},
  sampleData: {
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
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events: ['number.created'],
      }
    );

const { webhook } = response as { webhook: { webhook_id: string } };

    await context.store.put<string>(TRIGGER_KEY, webhook.webhook_id);  },  

  async onDisable(context) {
    const webhookId = await context.store?.get(TRIGGER_KEY);
    

    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
 const payload = context.payload.body as {
      event: string;
      data: Record<string, any>;
    };      
    // Verify this is a number created event
    if (payload.event === 'number.created') {
      return [payload.data];
    }
    
    return [];
  },
});