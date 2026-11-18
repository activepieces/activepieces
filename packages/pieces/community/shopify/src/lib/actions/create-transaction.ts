import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createTransaction } from '../common';
import { ShopifyTransactionKinds } from '../common/types';

export const createTransactionAction = createAction({
  auth: shopifyAuth,
  name: 'create_transaction',
  classification: 'DESTRUCTIVE',
  displayName: 'Create Transaction',
  description: 'Create a new transaction.',
  audience: 'both',
  aiMetadata: { description: 'Record a payment transaction (capture, refund, void, etc.) against an existing Shopify order; the transaction type/kind and order ID are required, with optional amount, currency, and parent transaction. Use to capture or refund payment on an order. Each call creates a new financial transaction, so it is not idempotent.', idempotent: false },
  propertyGroups: [
    {
      key: 'transaction',
      display: 'section',
      label: 'Transaction',
      icon: 'sliders',
      props: ['kind_info', 'orderId', 'kind', 'parentId'],
    },
    {
      key: 'payment',
      display: 'section',
      label: 'Payment',
      icon: 'tag',
      props: ['amount', 'currency'],
    },
  ],
  props: {
    kind_info: Property.MarkDown({
      value: 'Capture, Void and Refund act on the Parent Transaction ID.',
    }),
    orderId: Property.Number({
      displayName: 'Order ID',
      description: "From the order's URL in Shopify admin, not its #1001 number.",
      required: true,
    }),
    kind: Property.Dropdown({
      auth: shopifyAuth,
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
    parentId: Property.Number({
      displayName: 'Parent Transaction ID',
      description: 'The transaction to capture, void or refund.',
      required: false,
    }),
    amount: Property.ShortText({
      displayName: 'Amount',
      placeholder: '10.00',
      required: false,
      width: 'half',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Required for refunds and captures on multi-currency orders.',
      placeholder: 'USD',
      required: false,
      width: 'half',
    }),
    authorization: Property.ShortText({
      displayName: 'Authorization Key',
      description: 'The authorization code for this transaction.',
      required: false,
      advanced: true,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Set to external to record a cash payment made outside Shopify.',
      placeholder: 'external',
      required: false,
      advanced: true,
    }),
    test: Property.Checkbox({
      displayName: 'Test',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      orderId,
      kind,
      currency,
      amount,
      authorization,
      parentId,
      source,
      test,
    } = propsValue;

    return await createTransaction(
      orderId,
      {
        amount,
        currency,
        kind,
        authorization,
        parent_id: parentId,
        source,
        test,
      },
      auth
    );
  },
});
