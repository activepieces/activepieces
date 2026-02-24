import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const paymentCreatedTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'payment_created',
  displayName: 'Payment Created',
  description: 'Triggers when a payment is created (via Save Payment endpoint or Subscription)',
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
      eventTypes: ['payment-created'],
    });

    await context.store.put<WebhookResponse>('pinch_payment_created_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_payment_created_webhook');
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
    type: 'payment-created',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      payment: {
        id: 'pay_sample123456',
        amount: 5000,
        currency: 'AUD',
        status: 'scheduled',
        transactionDate: '2024-01-20',
        payer: {
          id: 'pyr_sample123456',
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john.doe@example.com',
        },
      },
    },
  },
});
