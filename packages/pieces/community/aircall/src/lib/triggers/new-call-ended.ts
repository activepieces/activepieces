import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newCallEndedTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_call_ended',
  displayName: 'New Call Ended',
  description: 'Triggers when a call ends',
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
      events: ['call.ended'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_call_ended', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_call_ended');
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
    
    // Filter for call.ended events
    if (payload.event === 'call.ended') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: {
    event: 'call.ended',
    data: {
      id: 123,
      direction: 'inbound',
      status: 'done',
      duration: 300,
      cost: 0.05,
      from: '+1234567890',
      to: '+0987654321',
      recording: 'https://api.aircall.io/v1/calls/123/recording',
      created_at: '2023-01-01T12:00:00Z',
      answered_at: '2023-01-01T12:01:00Z',
      ended_at: '2023-01-01T12:06:00Z',
    },
  },
}); 