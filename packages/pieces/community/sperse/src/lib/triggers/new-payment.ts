import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sperseAuth } from '../..';
import { sperseCommon } from '../common/common';

export const newPayment = createTrigger({
  auth: sperseAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Triggers when a new payment is created',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    contact: {
      email: 's@gmail.com',
      fullName: 'Test User',
      id: 636,
      phone: '98877676565',
    },
    invoice: {
      currencyId: 'USD',
      date: '2024-06-10T00:00:00Z',
      description: 'just a description',
      discountTotal: 0,
      grandTotal: 100,
      id: 457,
      number: 'INV - 20240610 - 746C',
      shippingTotal: 0,
      taxTotal: 0,
      lines: [
        {
          description: 'Me Spacial',
          productId: 810,
          quantity: 1,
          rate: 100,
          total: 100,
          unitId: 'Month',
        },
      ],
    },
    transaction: {
      amount: 100,
      currencyId: 'USD',
      date: '2024-06-10T09:36:01.832Z',
      gatewayName: null,
      gatewayTransactionId: null,
      id: 403,
      isSuccessful: true,
      type: 'Sale',
    },
    eventTime: '2024-06-10T09:36:08',
    eventType: 'Payment.Created',
  },
  async onEnable(context) {
    const webhookId = await sperseCommon.subscribeWebhook(
      'Payment.Created',
      context.auth.base_url,
      context.auth.api_key,
      context.webhookUrl
    );

    await context.store?.put<WebhookInformation>('_new_payment_trigger', {
      webhookId: webhookId,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      '_new_payment_trigger'
    );

    if (response !== null && response !== undefined) {
      await sperseCommon.unsubscribeWebhook(
        context.auth.base_url,
        context.auth.api_key,
        response.webhookId
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  webhookId: number;
}
