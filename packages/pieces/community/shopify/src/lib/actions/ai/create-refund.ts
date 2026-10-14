import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlRefund,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { createRefundOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCreateRefund = createAction({
  auth: shopifyAuth,
  name: 'create_refund',
  classification: 'DESTRUCTIVE',
  displayName: 'Create Refund',
  description: 'Refund money and/or line items on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves money back to the customer: creates a refund on an order for the given line items, shipping and refund transactions. Run calculate_refund first and pass its suggested transactions (parent transaction id, gateway, amount) and line items. When calculate_refund shows a presentment_currency_code different from the shop currency_code, pass the presentment amounts (presentment_amount, presentment_shipping_amount) and set currency to that presentment code. The customer is emailed only if notify is on. Generate your own idempotency_key (for example a UUID) on the first call and pass the same key again on every retry after an error or timeout so Shopify does not refund twice; the key used is returned and is included in any error message.',
    idempotent: false,
  },
  outputSchema: createRefundOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    line_items: shopifyProps.refundLineItems(),
    transactions: Property.Array({
      displayName: 'Refund Transactions',
      description:
        'The money to return, one entry per original payment. Copy parent_transaction_id, gateway and amount from calculate_refund suggested_transactions; when the order has a presentment currency different from the shop currency, copy presentment_amount instead of amount and set currency. Leave empty to refund items without returning money.',
      required: false,
      properties: {
        parent_transaction_id: Property.ShortText({
          displayName: 'Parent Transaction ID',
          description: 'The captured SALE or CAPTURE transaction being refunded, numeric or "gid://shopify/OrderTransaction/…".',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          description:
            'Amount to refund on this transaction, for example 19.99. In the presentment (customer) currency when currency is set, otherwise in the shop currency.',
          required: true,
        }),
        gateway: Property.ShortText({
          displayName: 'Gateway',
          description: 'Payment gateway of the parent transaction, for example "shopify_payments" or "bogus".',
          required: true,
        }),
      },
    }),
    shipping_full_refund: Property.Checkbox({
      displayName: 'Refund All Shipping',
      description: 'Refund the full remaining shipping cost. Off by default.',
      required: false,
      defaultValue: false,
    }),
    shipping_amount: Property.Number({
      displayName: 'Shipping Amount',
      description:
        'Refund only this much shipping, for example 4.50, in the same currency as the transaction amounts. Ignored when refunding all shipping.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description:
        'Presentment (customer) currency of the refund, for example "EUR" (presentment_currency_code from calculate_refund). Required when the presentment currency differs from the shop currency; then every amount given here must be the presentment amount. Leave empty when both currencies are the same.',
      required: false,
    }),
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Internal reason for the refund.',
      required: false,
    }),
    notify: Property.Checkbox({
      displayName: 'Notify Customer',
      description: 'Email the customer a refund notification. Off by default.',
      required: false,
      defaultValue: false,
    }),
    idempotency_key: shopifyProps.idempotencyKey(),
  },
  async run({ auth, propsValue }) {
    const orderId = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const transactions = shopifyValues.readRecords(propsValue.transactions).map((item) => {
      const parentId = shopifyValues.readText(item['parent_transaction_id']);
      const amount = shopifyValues.readNumber(item['amount']);
      const gateway = shopifyValues.readText(item['gateway']);
      if (!parentId || amount === undefined || !gateway) {
        throw new Error('Every refund transaction needs a parent_transaction_id, an amount and a gateway.');
      }
      return {
        orderId,
        parentId: shopifyGraphqlClient.toGid({ type: 'OrderTransaction', id: parentId }),
        amount: String(amount),
        gateway,
        kind: 'REFUND',
      };
    });
    const refundLineItems = shopifyValues.buildRefundLineItems(propsValue.line_items);
    const fullShipping = propsValue.shipping_full_refund ?? false;
    const shippingAmount = propsValue.shipping_amount;
    const shipping = fullShipping
      ? { fullRefund: true }
      : shippingAmount !== undefined && shippingAmount !== null
        ? { amount: String(shippingAmount) }
        : undefined;
    if (transactions.length === 0 && !refundLineItems && !shipping) {
      throw new Error('Provide line items, shipping or refund transactions to refund.');
    }
    const idempotencyKey = shopifyGraphqlClient.resolveIdempotencyKey(propsValue.idempotency_key);
    const input = shopifyValues.compact({
      orderId,
      refundLineItems,
      transactions: transactions.length > 0 ? transactions : undefined,
      shipping,
      currency: shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase(),
      note: shopifyValues.nonEmpty(propsValue.note),
      notify: propsValue.notify ?? false,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      refundCreate: {
        refund: GqlRefund | null;
        order: { id: string; totalRefundedSet?: { shopMoney?: { amount?: string | null } | null } | null } | null;
      } | null;
    }>({
      auth,
      query: `mutation CreateRefund($input: RefundInput!, $idempotencyKey: String!) { refundCreate(input: $input) @idempotent(key: $idempotencyKey) { refund { ${shopifyFields.REFUND_FIELDS} } order { id totalRefundedSet { ${shopifyFields.MONEY_FIELDS} } } userErrors { field message } } }`,
      primaryPaths: ['refundCreate.refund'],
      variables: { input },
      idempotencyKey,
    });
    const refund = data.refundCreate?.refund;
    if (!refund) {
      throw new Error(
        `Shopify did not return the refund. [idempotency_key used: ${idempotencyKey}. Retry with this same idempotency_key so Shopify does not repeat the operation.]`
      );
    }
    return {
      ...shopifyMappers.mapRefund(refund),
      order_total_refunded: data.refundCreate?.order?.totalRefundedSet?.shopMoney?.amount ?? null,
      idempotency_key: idempotencyKey,
      redacted_fields: redactedFields,
    };
  },
});
