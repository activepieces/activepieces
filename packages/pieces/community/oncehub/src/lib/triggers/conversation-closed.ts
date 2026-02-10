import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { oncehubAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
export const conversationClosed = createTrigger({
  auth: oncehubAuth,
  name: 'conversationClosed',
  displayName: 'Conversation Closed',
  description:
    'Triggered when: Website visitor reaches the end of the conversation flow and when Website visitor starts a new conversation with a different chatbot',
  props: {},
  sampleData: {
    id: 'EVNT-KN56U3YL7C',
    object: 'event',
    creation_time: '2020-03-22T09:49:12Z',
    type: 'conversation.closed',
    api_version: 'v2',
    data: {
      id: 'CVR-022EAEA41C',
      object: 'conversation',
      creation_time: '2021-07-13T12:28:24Z',
      initiated_by: 'contact',
      last_updated_time: '2021-07-13T12:33:54Z',
      last_interacted_time: '2021-07-13T12:33:54Z',
      contact: {
        object: 'contact',
        id: 'CTC-J4FR05BKEW',
        creation_time: '2020-03-22T09:48:48Z',
        last_updated_time: '2020-03-22T09:48:48Z',
        last_interacted_time: null,
        owner: 'USR-FSD423423',
        status: 'Qualified',
        city: 'New York',
        company_size: '50-100',
        company: 'Acme Inc',
        country: 'United States',
        email: 'carrie.customer@gmail.com',
        employees: 1,
        first_name: 'Carrie',
        has_consent: false,
        job_title: 'Executive Assistant',
        last_name: 'Customer',
        mobile_phone: '+12025550195',
        phone: '+12025550100',
        post_code: '10001',
        salutation: 'Ms.',
        state: 'New York',
        street_address: '123 Main Street',
        terms_of_sevice: false,
        timezone: 'America/New_York',
        custom_fields: [],
      },
      owner: {
        first_name: 'Andrea',
        last_name: 'Hartie',
        email: 'AndreaHartie@example.com',
        role_name: 'Member',
        timezone: 'America/Chicago',
        teams: ['TM-GCJU8DLBTPY1'],
      },
      status: 'closed',
      bot: 'BOT-62774A40FB',
      '...': '[Additional Properties Truncated]',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const api_key = context.auth.secret_text;
        const { webhookUrl } = context;
    
        const response = await makeRequest(api_key, HttpMethod.POST, '/webhooks', {
          url: webhookUrl,
          name: `conversation closed Webhook - ${new Date().getTime()}`,
          events: ['conversation.closed'],
        });

        await context.store.put('webhookId_conversationClosed', response.id);
  },
  async onDisable(context) {
    const api_key = context.auth.secret_text;
    const webhookId = await context.store.get<string>(
      'webhookId_conversationClosed'
    );

    if (webhookId) {
      await makeRequest(api_key, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    }

    await context.store.delete('webhookId_conversationClosed');
  },
  async run(context) {
    return [context.payload.body];
  },
});
