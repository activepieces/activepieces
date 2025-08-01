import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newNumberCreatedTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_number_created',
  displayName: 'New Number Created',
  description: 'Triggers when a new number is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  onEnable: async (context) => {
    const client = makeClient({
      username: context.auth.username,
      password: context.auth.password,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const webhook = await client.createWebhook({
      url: context.webhookUrl,
      events: ['number.created'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_number_created', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_number_created');
    if (webhook) {
      const client = makeClient({
        username: context.auth.username,
        password: context.auth.password,
        baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
      });
      await client.deleteWebhook(webhook.id);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as { event: string; data: unknown };
    
    // Filter for number.created events
    if (payload.event === 'number.created') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: {
    event: 'number.created',
    data: {
      id: 123,
      name: 'Main Office',
      number: '+1234567890',
      country: 'US',
      time_zone: 'America/New_York',
      created_at: '2023-01-01T12:00:00Z',
    },
  },
}); 