import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newSmsTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_sms',
  displayName: 'New SMS',
  description: 'Triggers when a new SMS is received',
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
      events: ['message.received'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_sms', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_sms');
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
    
    // Filter for message.received events
    if (payload.event === 'message.received') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: async ({ auth }: { auth: { username: string; password: string; baseUrl?: string } }) => {
    try {
      const client = makeClient({
        username: auth.username,
        password: auth.password,
        baseUrl: auth.baseUrl || 'https://api.aircall.io/v1',
      });

      // Fetch real messages from Aircall API
      const messages = await client.getMessages({ limit: 1 });
      
      if (messages && messages.length > 0) {
        const message = messages[0];
        return {
          event: 'message.received',
          data: {
            id: message.id,
            type: message.type,
            direction: message.direction,
            content: message.content,
            from: message.from,
            to: message.to,
            created_at: message.created_at,
          },
        };
      }

      // Fallback to sample data if no messages found
      return {
        event: 'message.received',
        data: {
          id: 123,
          type: 'message',
          direction: 'inbound',
          content: 'Hello from Aircall!',
          from: '+1234567890',
          to: '+0987654321',
          created_at: '2023-01-01T12:00:00Z',
        },
      };
    } catch (error) {
      console.error('Error fetching sample data:', error);
      // Return fallback sample data on error
      return {
        event: 'message.received',
        data: {
          id: 123,
          type: 'message',
          direction: 'inbound',
          content: 'Hello from Aircall!',
          from: '+1234567890',
          to: '+0987654321',
          created_at: '2023-01-01T12:00:00Z',
        },
      };
    }
  },
}); 