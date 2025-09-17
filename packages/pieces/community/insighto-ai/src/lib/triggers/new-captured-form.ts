import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CapturedFormWebhookSchema } from '../schemas';

export const newCapturedForm = createTrigger({
  name: 'new_captured_form',
  displayName: 'New Captured Form',
  description: 'Fires when a new form submission is captured in Insighto.ai',
  props: {},
  sampleData: {
    id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
    object: 'event',
    event: 'captured_form.created',
    created_at: '2023-11-07T05:31:56Z',
    data: {
      captured_form_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      form_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      conversation_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      widget_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      assistant_id: '3c90c3cc-0d44-4b50-8888-8dd25736052a',
      form_name: 'Contact Form',
      field_values: {
        first_name: 'Joe',
        last_name: 'Doe'
      },
      attributes: {}
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const apiKey = context.auth as string;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.insighto.ai/api/v1/outbound_webhook',
        queryParams: { api_key: apiKey },
        body: {
          endpoint: webhookUrl,
          name: 'Activepieces Captured Form Webhook',
          enabled: true,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await context.store.put('webhook_id', response.body.data?.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get('webhook_id');
    if (!webhookId) return;

    const apiKey = context.auth as string;

    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.insighto.ai/api/v1/outbound_webhook/${webhookId}`,
        queryParams: { api_key: apiKey },
      });
    } catch {
      // Webhook deletion failed, ignore error
    }

    await context.store.delete('webhook_id');
  },
  async run(context) {
    const payload = context.payload.body;

    try {
      // Validate webhook payload
      const validatedPayload = CapturedFormWebhookSchema.parse(payload);
      return [validatedPayload];
    } catch {
      return [];
    }
  },
});
