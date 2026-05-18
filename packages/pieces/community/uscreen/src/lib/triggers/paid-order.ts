import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { uscreenAuth } from '../common/auth';
import { UscreenClient, UscreenInvoice } from '../common/client';

const sampleData = {
  id: '789012',
  title: 'Masterclass Bundle',
  total: '49.99 USD',
  amount: '39.99 USD',
  discount: '10.00 USD',
  offer_id: '98765',
  customer_name: 'Jane Smith',
  customer_email: 'customer@example.com',
  country_code: 'US',
  transaction_id: 'tr_1001abcd',
  ip_address: '192.168.1.101',
  origin: 'Stripe',
  coupon: 'WELCOME10',
  event: 'order_paid',
};
export const paidOrder = createTrigger({
  auth: uscreenAuth,
  name: 'paid_order',
  displayName: 'Paid Order',
  description:
    'Triggers when a payment is processed for subscriptions, bundles, or content.',
  props: {},
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    //Empty
  },

  async onDisable(context) {
    //Empty
  },

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;

    if (payload.event !== 'order_paid') {
      return [];
    }

    return [payload];
  },

  async test(context) {
    return [sampleData];
  },
});
