import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

interface WebhookInformation {
  webhookId: string;
}

interface WebhookPayload {
  event?: string;
}

export const newContact = createTrigger({
  auth: insightoAiAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created.',
  props: {},
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    id: 'evt-9876zyxw',
    object: 'event',
    event: 'contact.created',
    created_at: '2025-09-14T20:30:00Z',
    data: {
      contact_id: 'ctc-5678ijkl',
      email: 'jane.doe@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+15551234567',
      created_at: '2025-09-14T20:30:00Z',
    },
  },

  async onEnable(context) {
    const response = await httpClient.sendRequest<{ data: { id: string } }>({
      method: HttpMethod.POST,
      url: 'https://api.insighto.ai/v1/outbound_webhook',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      body: {
        endpoint: context.webhookUrl,
        name: 'Activepieces - New Contact Trigger',
        enabled: true,
      },
    });

    await context.store.put<WebhookInformation>(
      'insighto_new_contact_webhook',
      {
        webhookId: response.body.data.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      'insighto_new_contact_webhook'
    );
    if (webhookInfo?.webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.insighto.ai/v1/outbound_webhook/${webhookInfo.webhookId}`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as WebhookPayload;

    if (payload.event === 'contact.created') {
      return [context.payload.body];
    }

    return [];
  },
});
