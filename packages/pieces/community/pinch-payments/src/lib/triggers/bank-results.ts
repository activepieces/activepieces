import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const bankResultsTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'bank_results',
  displayName: 'Bank Results Event',
  description: 'Triggers when a bank account transaction returns (may result in dishonour status)',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const credentials = {
      username: context.auth.props.username,
      password: context.auth.props.password,
    };

    const webhook = await createWebhook(credentials, {
      uri: context.webhookUrl,
      webhookFormat: 'camel-case',
      eventTypes: ['bank-results'],
    });

    await context.store.put<WebhookResponse>('pinch_bank_results_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_bank_results_webhook');
    if (webhook) {
      const credentials = {
        username: context.auth.props.username,
        password: context.auth.props.password,
      };
      await deleteWebhook(credentials, webhook.id);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: 'evt_sample123456',
    type: 'bank-results',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      payments: [
        {
          id: 'pay_sample123456',
          amount: 5000,
          status: 'dishonoured',
          payer: {
            id: 'pyr_sample123456',
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john.doe@example.com',
          },
        },
      ],
    },
  },
});
