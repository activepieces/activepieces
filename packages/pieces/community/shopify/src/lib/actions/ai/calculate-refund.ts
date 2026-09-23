import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlMoneyBag,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCalculateRefund = createAction({
  auth: shopifyAuth,
  name: 'calculate_refund',
  classification: 'READ',
  displayName: 'Calculate Refund',
  description: 'Preview the refund Shopify suggests for an order, without refunding.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Previews a refund without moving money: returns the amount, tax, shipping and the suggested refund transactions (parent transaction id, gateway, amount) for the chosen line items and shipping. Every amount is in the shop currency; the presentment_* fields give the same amounts in the customer (presentment) currency. Run it before create_refund and pass its suggested transactions and line items there; when presentment_currency_code differs from currency_code, pass the presentment amounts and presentment_currency_code to create_refund. Read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    line_items: shopifyProps.refundLineItems(),
    refund_shipping: Property.Checkbox({
      displayName: 'Refund All Shipping',
      description: 'Include the full shipping cost in the suggestion. Off by default.',
      required: false,
      defaultValue: false,
    }),
    shipping_amount: Property.Number({
      displayName: 'Shipping Amount',
      description: 'Refund only this much shipping, for example 4.50. Ignored when refunding all shipping.',
      required: false,
    }),
    suggest_full_refund: Property.Checkbox({
      displayName: 'Suggest Full Refund',
      description: 'Suggest refunding everything still refundable on the order. Off by default.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const refundShipping = propsValue.refund_shipping ?? false;
    const shippingAmount =
      !refundShipping && propsValue.shipping_amount !== undefined && propsValue.shipping_amount !== null
        ? String(propsValue.shipping_amount)
        : undefined;
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: { id: string; suggestedRefund?: GqlSuggestedRefund | null } | null;
    }>({
      auth,
      query: `query CalculateRefund($id: ID!, $refundLineItems: [RefundLineItemInput!], $refundShipping: Boolean, $shippingAmount: Money, $suggestFullRefund: Boolean) { order(id: $id) { id suggestedRefund(refundLineItems: $refundLineItems, refundShipping: $refundShipping, shippingAmount: $shippingAmount, suggestFullRefund: $suggestFullRefund) { amountSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } subtotalSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } totalTaxSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } maximumRefundableSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } discountedSubtotalSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } shipping { amountSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } maximumRefundableSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } taxSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } } refundLineItems { quantity restockType priceSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } subtotalSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } totalTaxSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } lineItem { id title sku } location { id } } suggestedTransactions { kind gateway amountSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } maximumRefundableSet { ${shopifyFields.MONEY_WITH_PRESENTMENT_FIELDS} } parentTransaction { id } } } } }`,
      primaryPaths: ['order.suggestedRefund'],
      variables: shopifyValues.compact({
        id,
        refundLineItems: shopifyValues.buildRefundLineItems(propsValue.line_items),
        refundShipping,
        shippingAmount,
        suggestFullRefund: propsValue.suggest_full_refund ?? false,
      }),
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    const suggestion = data.order.suggestedRefund;
    return {
      order_id: data.order.id,
      amount: shopifyValues.money(suggestion?.amountSet),
      currency_code: suggestion?.amountSet?.shopMoney?.currencyCode ?? null,
      presentment_amount: shopifyValues.presentmentMoney(suggestion?.amountSet),
      presentment_currency_code: shopifyValues.presentmentCurrency(suggestion?.amountSet),
      subtotal: shopifyValues.money(suggestion?.subtotalSet),
      presentment_subtotal: shopifyValues.presentmentMoney(suggestion?.subtotalSet),
      total_tax: shopifyValues.money(suggestion?.totalTaxSet),
      presentment_total_tax: shopifyValues.presentmentMoney(suggestion?.totalTaxSet),
      maximum_refundable: shopifyValues.money(suggestion?.maximumRefundableSet),
      presentment_maximum_refundable: shopifyValues.presentmentMoney(suggestion?.maximumRefundableSet),
      discounted_subtotal: shopifyValues.money(suggestion?.discountedSubtotalSet),
      presentment_discounted_subtotal: shopifyValues.presentmentMoney(suggestion?.discountedSubtotalSet),
      shipping_amount: shopifyValues.money(suggestion?.shipping?.amountSet),
      presentment_shipping_amount: shopifyValues.presentmentMoney(suggestion?.shipping?.amountSet),
      shipping_tax: shopifyValues.money(suggestion?.shipping?.taxSet),
      presentment_shipping_tax: shopifyValues.presentmentMoney(suggestion?.shipping?.taxSet),
      shipping_maximum_refundable: shopifyValues.money(suggestion?.shipping?.maximumRefundableSet),
      presentment_shipping_maximum_refundable: shopifyValues.presentmentMoney(
        suggestion?.shipping?.maximumRefundableSet
      ),
      refund_line_items: (suggestion?.refundLineItems ?? []).map((item) => ({
        line_item_id: item.lineItem?.id ?? null,
        title: item.lineItem?.title ?? null,
        sku: item.lineItem?.sku ?? null,
        quantity: item.quantity ?? null,
        restock_type: item.restockType ?? null,
        location_id: item.location?.id ?? null,
        price: shopifyValues.money(item.priceSet),
        presentment_price: shopifyValues.presentmentMoney(item.priceSet),
        subtotal: shopifyValues.money(item.subtotalSet),
        presentment_subtotal: shopifyValues.presentmentMoney(item.subtotalSet),
        total_tax: shopifyValues.money(item.totalTaxSet),
        presentment_total_tax: shopifyValues.presentmentMoney(item.totalTaxSet),
      })),
      suggested_transactions: (suggestion?.suggestedTransactions ?? []).map((transaction) => ({
        kind: transaction.kind ?? null,
        gateway: transaction.gateway ?? null,
        parent_transaction_id: transaction.parentTransaction?.id ?? null,
        amount: shopifyValues.money(transaction.amountSet),
        currency_code: transaction.amountSet?.shopMoney?.currencyCode ?? null,
        presentment_amount: shopifyValues.presentmentMoney(transaction.amountSet),
        presentment_currency_code: shopifyValues.presentmentCurrency(transaction.amountSet),
        maximum_refundable: shopifyValues.money(transaction.maximumRefundableSet),
        presentment_maximum_refundable: shopifyValues.presentmentMoney(transaction.maximumRefundableSet),
      })),
      redacted_fields: redactedFields,
    };
  },
});

type GqlSuggestedRefund = {
  amountSet?: GqlMoneyBag | null;
  subtotalSet?: GqlMoneyBag | null;
  totalTaxSet?: GqlMoneyBag | null;
  maximumRefundableSet?: GqlMoneyBag | null;
  discountedSubtotalSet?: GqlMoneyBag | null;
  shipping?: {
    amountSet?: GqlMoneyBag | null;
    maximumRefundableSet?: GqlMoneyBag | null;
    taxSet?: GqlMoneyBag | null;
  } | null;
  refundLineItems?: {
    quantity?: number | null;
    restockType?: string | null;
    priceSet?: GqlMoneyBag | null;
    subtotalSet?: GqlMoneyBag | null;
    totalTaxSet?: GqlMoneyBag | null;
    lineItem?: { id?: string | null; title?: string | null; sku?: string | null } | null;
    location?: { id?: string | null } | null;
  }[] | null;
  suggestedTransactions?: {
    kind?: string | null;
    gateway?: string | null;
    amountSet?: GqlMoneyBag | null;
    maximumRefundableSet?: GqlMoneyBag | null;
    parentTransaction?: { id?: string | null } | null;
  }[] | null;
};
