import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getTransaction } from '../common';

export const getTransactionAction = createAction({
  auth: shopifyAuth,
  name: 'get_transaction',
  classification: 'READ',
  displayName: 'Get Transaction',
  description: `Get an existing transaction's information.`,
  audience: 'both',
  aiMetadata: { description: 'Look up a single payment transaction by its transaction ID within a given order. Read-only and repeatable; use to inspect payment, capture, or refund details when you already know both the order ID and transaction ID.', idempotent: true },
  propertyGroups: [
    {
      key: 'transaction',
      display: 'section',
      label: 'Transaction to get',
      icon: 'inbox',
      props: ['orderId', 'transactionId'],
    },
  ],
  props: {
    orderId: Property.Number({
      displayName: 'Order ID',
      description: "From the order's URL in Shopify admin, not its #1001 number.",
      required: true,
      width: 'half',
    }),
    transactionId: Property.Number({
      displayName: 'Transaction ID',
      description: 'Get it from a Get Order Transactions step.',
      required: true,
      width: 'half',
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, transactionId } = propsValue;

    return await getTransaction(transactionId, orderId, auth);
  },
});
