import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getTransactions } from '../common';

export const getTransactionsAction = createAction({
  auth: shopifyAuth,
  name: 'get_transactions',
  displayName: 'Get Order Transactions',
  description: `Get an order's transactions.`,
  audience: 'both',
  aiMetadata: { description: "List all payment transactions (authorizations, captures, refunds, voids) recorded against a specific Shopify order, given the order ID. Use to inspect an order's financial history. Read-only and idempotent.", idempotent: true },
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId } = propsValue;

    return await getTransactions(orderId, auth);
  },
});
