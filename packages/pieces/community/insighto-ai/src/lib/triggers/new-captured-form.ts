import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

interface WebhookInformation {
  webhookId: string;
}

interface WebhookPayload {
  event?: string;
}

export const newCapturedForm = createTrigger({
  auth: insightoAiAuth,
  name: 'new_captured_form',
  displayName: 'New Captured Form',
  description: 'Fires when a new form submission is captured in Insighto.ai.',
  props: {},
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    object: 'event',
    event: 'captured_form.created',
    created_at: '2025-09-14T14:20:00Z',
    data: {
      captured_form_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      form_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      form_name: 'User Feedback Form',
      field_values: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      },
      attributes: {},
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
        name: 'Activepieces - New Captured Form Trigger',
        enabled: true,
      },
    });

    await context.store.put<WebhookInformation>('insighto_new_captured_form', {
      webhookId: response.body.data.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>(
      'insighto_new_captured_form'
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

    if (payload.event === 'captured_form.created') {
      return [context.payload.body];
    }

    return [];
  },
});
