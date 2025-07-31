import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newNoteTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_note',
  displayName: 'New Note',
  description: 'Triggers when a new note is added to a call',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  onEnable: async (context) => {
    const client = makeClient({
      apiToken: context.auth.apiToken,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const webhook = await client.createWebhook({
      url: context.webhookUrl,
      events: ['call.commented'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_note', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_note');
    if (webhook) {
      const client = makeClient({
        apiToken: context.auth.apiToken,
        baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
      });
      await client.deleteWebhook(webhook.id);
    }
  },
  run: async (context) => {
    const payload = context.payload.body as any;
    
    // Filter for call.commented events
    if (payload.event === 'call.commented') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: {
    event: 'call.commented',
    data: {
      id: 123,
      call_id: 456,
      content: 'Customer requested callback',
      user_id: 789,
      created_at: '2023-01-01T12:00:00Z',
    },
  },
}); 