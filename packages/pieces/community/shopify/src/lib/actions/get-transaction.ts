import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getTransaction } from '../common';

export const getTransactionAction = createAction({
  auth: shopifyAuth,
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description: `Get an existing transaction's information.`,
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
