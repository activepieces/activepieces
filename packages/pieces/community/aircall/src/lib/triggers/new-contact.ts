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
      events: ['contact.created'],
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
    
    // Filter for contact.created events
    if (payload.event === 'contact.created') {
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

      // Fetch real contacts from Aircall API
      const contacts = await client.getContacts({ limit: 1 });
      
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        return {
          event: 'contact.created',
          data: {
            id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            company_name: contact.company_name,
            information: contact.information,
            emails: contact.emails || [],
            phone_numbers: contact.phone_numbers || [],
            created_at: contact.created_at,
            updated_at: contact.updated_at,
          },
        };
      }

      // Fallback to sample data if no contacts found
      return {
        event: 'contact.created',
        data: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Acme Corp',
          information: 'Customer since 2020',
          emails: ['john.doe@acme.com'],
          phone_numbers: ['+1234567890'],
          created_at: '2023-01-01T12:00:00Z',
          updated_at: '2023-01-01T12:00:00Z',
        },
      };
    } catch (error) {
      console.error('Error fetching sample data:', error);
      // Return fallback sample data on error
      return {
        event: 'contact.created',
        data: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Acme Corp',
          information: 'Customer since 2020',
          emails: ['john.doe@acme.com'],
          phone_numbers: ['+1234567890'],
          created_at: '2023-01-01T12:00:00Z',
          updated_at: '2023-01-01T12:00:00Z',
        },
      };
    }
  },
}); 