import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createTransaction } from '../common';
import { ShopifyTransactionKinds } from '../common/types';

export const createTransactionAction = createAction({
  auth: shopifyAuth,
  name: 'create_transaction',
  displayName: 'Create Transaction',
  description: 'Create a new transaction.',
  props: {
    orderId: Property.Number({
      displayName: 'Order',
      description: 'The ID of the order to create a transaction for.',
      required: true,
    }),
    kind: Property.Dropdown({
      displayName: 'Type',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: Object.values(ShopifyTransactionKinds).map((kind) => {
            return {
              label: kind.charAt(0).toUpperCase() + kind.slice(1),
              value: kind,
            };
          }),
        };
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      required: false,
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      required: false,
    }),
    authorization: Property.ShortText({
      displayName: 'Authorization Key',
      required: false,
    }),
    parentId: Property.Number({
      displayName: 'Parent ID',
      description: 'The ID of an associated transaction.',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description:
        'An optional origin of the transaction. Set to external to import a cash transaction for the associated order.',
      required: false,
    }),
    test: Property.Checkbox({
      displayName: 'Test',
      description: 'Whether the transaction is a test transaction.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { orderId, kind, currency, amount, parentId, source, test } =
      propsValue;

    return await createTransaction(
      orderId,
      {
        amount,
        currency,
        kind,
        parent_id: parentId,
        source,
        test,
      },
      auth
    );
  },
});
