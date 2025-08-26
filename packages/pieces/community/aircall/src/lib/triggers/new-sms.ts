import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const TRIGGER_KEY = 'trigger_new-sms'

export const newSms = createTrigger({
  auth: aircallAuth,
  name: 'newSms',
  displayName: 'New SMS',
  description: 'Triggers when a new SMS message is received.',
  props: {},
  sampleData:  {
      id: 12345,
      direction: 'inbound',
      body: 'Hello, this is a test SMS message',
      sent_at: '2023-07-31T10:30:00Z',
      from: '+1234567890',
      to: '+0987654321',
      number: {
        id: 123,
        name: 'Main Number',
        digits: '+0987654321',
      },
      contact: {
        id: 456,
        first_name: 'John',
        last_name: 'Doe',
        phone_numbers: [
          {
            id: 789,
            label: 'Mobile', 
            value: '+1234567890',
          },
        ],
      },
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
        events: ['message.received'],
      }
    );

 const { webhook } = response as { webhook: { webhook_id: string } };

    await context.store.put<string>(TRIGGER_KEY, webhook.webhook_id);   },

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

    if (payload.event === 'message.received') {
      return [payload.data];
    }
    
    return [];
  },
});