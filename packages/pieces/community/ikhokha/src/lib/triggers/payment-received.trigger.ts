import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ikhokhaAuth } from '../auth';

const TRIGGER_KEY = 'ikhokha-payment-received';

export const paymentReceivedTrigger = createTrigger({
  auth: ikhokhaAuth,
  name: 'payment_received',
  displayName: 'Payment Received',
  description:
    'Triggers when iKhokha sends a webhook confirming a completed payment.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'payment.success',
    paymentId: 'ikh_12345',
    amount: 59900,
    currency: 'ZAR',
    status: 'SUCCESS',
    externalReference: 'INV-1001',
    customerEmail: 'jane@example.com',
  },

  async onEnable(context) {
    await context.store.put(TRIGGER_KEY, {
      url: context.webhookUrl,
      enabledAt: new Date().toISOString(),
    });
  },

  async onDisable(context) {
    await context.store.delete(TRIGGER_KEY);
  },

  async run(context) {
    const body = context.payload.body as
      | { event?: string; status?: string }
      | undefined;
    if (!body) return [];
    const isSuccess =
      body.event === 'payment.success' || body.status === 'SUCCESS';
    if (!isSuccess) return [];
    return [body];
  },

  async test(context) {
    return [
      {
        event: 'payment.success',
        paymentId: 'ikh_test_123',
        amount: 10000,
        currency: 'ZAR',
        status: 'SUCCESS',
        externalReference: 'TEST-001',
      },
    ];
  },
});
