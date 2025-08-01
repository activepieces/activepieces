import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';
import { CreateWebhookResponse } from '../common/types';

export const newContactTrigger = createTrigger({
  auth: aircallAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
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
      events: ['contact.updated'],
    });

    await context.store.put<CreateWebhookResponse>('aircall_new_contact', webhook);
  },
  onDisable: async (context) => {
    const webhook = await context.store.get<CreateWebhookResponse>('aircall_new_contact');
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
    
    // Filter for contact.updated events (new contacts trigger this event)
    if (payload.event === 'contact.updated') {
      return [payload.data];
    }
    
    return [];
  },
  sampleData: {
    event: 'contact.updated',
    data: {
      id: 123,
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Acme Corp',
      information: 'Customer since 2020',
      emails: ['john.doe@acme.com'],
      phone_numbers: ['+1234567890'],
      created_at: '2023-01-01T12:00:00Z',
    },
  },
}); 