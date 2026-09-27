import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTransaction,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCaptureOrderPayment = createAction({
  auth: shopifyAuth,
  name: 'capture_order_payment',
  classification: 'WRITE',
  displayName: 'Capture Order Payment',
  description: 'Capture money from an authorized payment on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves money: captures all or part of an authorized payment on an order. Needs the authorization transaction id from list_order_transactions and the amount to capture. To release an authorization without charging use void_order_transaction; to record an offline payment use mark_order_as_paid. Each call is a new capture, so do not retry blindly; check list_order_transactions first.',
    idempotent: false,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…".',
      required: true,
    }),
    parent_transaction_id: Property.ShortText({
      displayName: 'Authorization Transaction ID',
      description:
        'The AUTHORIZATION transaction to capture, numeric or "gid://shopify/OrderTransaction/…". Find it with list_order_transactions.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Amount to capture, for example 49.99. Cannot exceed the authorized amount still capturable.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Three-letter currency of the amount, for example "EUR". Required when the order was paid in a currency other than the shop currency.',
      required: false,
    }),
    final_capture: shopifyProps.booleanChoice({
      displayName: 'Final Capture',
      description:
        'For payments that allow several captures: Yes releases the rest of the authorization after this capture. Leave empty for the gateway default.',
    }),
  },
  async run({ auth, propsValue }) {
    const input = shopifyValues.compact({
      id: shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id }),
      parentTransactionId: shopifyGraphqlClient.toGid({
        type: 'OrderTransaction',
        id: propsValue.parent_transaction_id,
      }),
      amount: String(propsValue.amount),
      currency: shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase(),
      finalCapture: shopifyValues.toBooleanChoice(propsValue.final_capture),
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderCapture: { transaction: GqlTransaction | null } | null;
    }>({
      auth,
      query: `mutation CaptureOrderPayment($input: OrderCaptureInput!) { orderCapture(input: $input) { transaction { ${shopifyFields.TRANSACTION_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['orderCapture.transaction'],
      variables: { input },
    });
    const transaction = data.orderCapture?.transaction;
    if (!transaction) {
      throw new Error('Shopify did not return the capture transaction.');
    }
    return {
      ...shopifyMappers.mapTransaction(transaction),
      redacted_fields: redactedFields,
    };
  },
});
