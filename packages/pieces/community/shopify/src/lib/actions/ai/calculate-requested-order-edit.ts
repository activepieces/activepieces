import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import {
  GqlCalculatedRequestedOrderEdit,
  requestedOrderEditFields,
  requestedOrderEditHelpers,
} from '../../common/requested-order-edits';
import { calculateRequestedOrderEditOutputSchema } from '../../output-schemas/requested-order-edits';

export const shopifyAiCalculateRequestedOrderEdit = createAction({
  auth: shopifyAuth,
  name: 'calculate_requested_order_edit',
  classification: 'READ',
  displayName: 'Calculate Requested Order Edit',
  description: 'Preview the money effect of removing line items from an order, without changing anything.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Previews the financial outcome of a buyer-style order edit that removes unfulfilled line items: the subtotal, order-level discounts, tax and total of the removed items (shop and presentment currency) plus the per-line-item amounts. Nothing is saved and no one is notified. Take the line item ids and unfulfilled quantities from get_order; the quantity per line item cannot exceed its unfulfilled quantity. Run it before create_requested_order_edit to show the buyer or merchant the impact. Needs the read_orders access scope. Without the read_all_orders scope only orders from the last 60 days are visible. Read-only, safe to repeat.',
    idempotent: true,
  },
  outputSchema: calculateRequestedOrderEditOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    line_items: requestedOrderEditHelpers.removalsProp(),
  },
  async run({ auth, propsValue }) {
    const orderId = requestedOrderEditHelpers.readTypedId({ type: 'Order', value: propsValue.order_id, label: 'order_id' });
    const removals = requestedOrderEditHelpers.buildRemovals(propsValue.line_items);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      requestedOrderEditCalculate: GqlCalculatedRequestedOrderEdit | null;
    }>({
      auth,
      query: `query CalculateRequestedOrderEdit($input: CalculateRequestedOrderEditInput!) { requestedOrderEditCalculate(input: $input) { ${requestedOrderEditFields.CALCULATED_REQUESTED_ORDER_EDIT_FIELDS} } }`,
      variables: { input: { orderId, lineItems: { removals } } },
      primaryPaths: ['requestedOrderEditCalculate'],
    });
    const calculated = data.requestedOrderEditCalculate;
    if (!calculated) {
      throw new Error(`Shopify returned no calculation for order ${orderId}. Check the order and line item ids with get_order.`);
    }
    return {
      order_id: orderId,
      ...requestedOrderEditHelpers.mapCalculatedRequestedOrderEdit(calculated),
      redacted_fields: redactedFields,
    };
  },
});
