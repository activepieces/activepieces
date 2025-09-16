import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CapturedFormWebhookSchema, CapturedFormWebhook } from '../schemas';

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
    // Note: Insighto.ai webhooks may need to be configured manually in their dashboard
    // or they may provide webhook management APIs. For now, we'll assume manual configuration.
    // If webhook registration APIs exist, they should be implemented here.
    await context.store.put('webhook_enabled', true);
  },
  async onDisable(context) {
    // Clean up webhook configuration if needed
    await context.store.delete('webhook_enabled');
  },
  async run(context) {
    const payload = context.payload.body;

    try {
      // Validate webhook payload
      const validatedPayload = CapturedFormWebhookSchema.parse(payload);
      return [validatedPayload];
    } catch (error) {
      console.warn('Invalid webhook payload:', payload, error);
      return [];
    }
  },
});
