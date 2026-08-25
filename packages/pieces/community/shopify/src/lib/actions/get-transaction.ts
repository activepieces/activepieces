import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getTransaction } from '../common';

export const getTransactionAction = createAction({
  auth: shopifyAuth,
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description: `Get an existing transaction's information.`,
  audience: 'both',
  aiMetadata: { description: 'Look up a single payment transaction by its transaction ID within a given order. Read-only and repeatable; use to inspect payment, capture, or refund details when you already know both the order ID and transaction ID.', idempotent: true },
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order.',
      required: true,
    }),
    transactionId: Property.Number({
      displayName: 'Transaction',
      description: 'The ID of the transaction',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, transactionId } = propsValue;

    return await getTransaction(transactionId, orderId, auth);
  },
});
