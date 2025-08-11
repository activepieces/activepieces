import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const TRIGGER_KEY = 'trigger_new-contact'

export const newContact = createTrigger({
  auth: aircallAuth,
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created.',
  props: {},
  sampleData:  {
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
        events: ['contact.created'],
      }
    );

  const { webhook } = response as { webhook: { webhook_id: string } };

    await context.store.put<string>(TRIGGER_KEY, webhook.webhook_id);  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    

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

    if (payload.event === 'contact.created') {
      return [payload.data];
    }
    
    return [];
  },
    async test(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      '/contacts?order=desc&per_page=10'
    );

    const { contacts } = response as { contacts: { id: number }[] };

    return contacts;
  },
});