import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { yocoAuth } from '../auth';

const TRIGGER_KEY = 'yoco-payment-succeeded';

export const paymentSucceededTrigger = createTrigger({
  auth: yocoAuth,
  name: 'payment_succeeded',
  displayName: 'Payment Succeeded',
  description:
    'Triggers when Yoco sends a webhook confirming a successful payment.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    type: 'payment.succeeded',
    payload: {
      id: 'p_xxxxxxxxxxxxx',
      checkoutId: 'co_xxxxxxxxxxxxx',
      amount: 59900,
      currency: 'ZAR',
      status: 'succeeded',
      createdDate: '2026-10-09T14:00:00.000Z',
      metadata: { reference: 'INV-1001' },
    },
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
      | { type?: string; payload?: unknown }
      | undefined;
    if (!body || !body.type) return [];

    // Yoco fires many event types. We only pass successful payments through.
    if (body.type !== 'payment.succeeded') return [];

    return [body];
  },

  async test(context) {
    return [
      {
        type: 'payment.succeeded',
        payload: {
          id: 'p_test_123',
          amount: 10000,
          currency: 'ZAR',
          status: 'succeeded',
          metadata: { reference: 'TEST-001' },
        },
      },
    ];
  },
});
