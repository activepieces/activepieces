import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createWebhook, deleteWebhook, WebhookResponse } from '../common/client';

export const realtimePaymentTrigger = createTrigger({
  auth: pinchPaymentsAuth,
  name: 'realtime_payment',
  displayName: 'Realtime Payment',
  description: 'Triggers when a realtime payment is executed',
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
      eventTypes: ['realtime-payment'],
    });

    await context.store.put<WebhookResponse>('pinch_realtime_payment_webhook', webhook);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookResponse>('pinch_realtime_payment_webhook');
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
    type: 'realtime-payment',
    eventDate: '2024-01-15T10:30:00Z',
    metadata: {},
    data: {
      payment: {
        id: 'pay_sample123456',
        amount: 5000,
        currency: 'AUD',
        status: 'successful',
        sourceType: 'credit-card',
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
