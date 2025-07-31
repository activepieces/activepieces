import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newContact = createTrigger({
  auth: aircallAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created in your Aircall account',
  props: {},
  sampleData: {
    event: 'contact.created',
    resource: 'contact',
    timestamp: 158561587,
    token: '45XXYYZZa08',
    data: {
      id: 456,
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Acme Corp',
      information: 'Important client contact',
      is_shared: true,
      created_at: '2023-07-31T10:30:00Z',
      updated_at: '2023-07-31T10:30:00Z',
      phone_numbers: [
        {
          id: 789,
          label: 'Work',
          value: '+1234567890'
        },
        {
          id: 790,
          label: 'Mobile',
          value: '+1234567891'
        }
      ],
      emails: [
        {
          id: 123,
          label: 'Office',
          value: 'john.doe@acme.com'
        }
      ]
    }
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const accessToken = context.auth.access_token;

    const webhook = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events: ['contact.created'],
      }
    );

    await context.store?.put('webhook_id', webhook.webhook.id);
  },

  async onDisable(context) {
    const webhookId = await context.store?.get('webhook_id');
    const accessToken = context.auth.access_token;

    if (webhookId) {
      await makeRequest(
        accessToken,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload.body as { event?: string };
    
    // Verify this is a contact created event
    if (payload.event === 'contact.created') {
      return [payload];
    }
    
    return [];
  },
});