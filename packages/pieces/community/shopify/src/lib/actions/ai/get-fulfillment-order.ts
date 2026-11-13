import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { fulfillmentOrderOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiGetFulfillmentOrder = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment_order',
  classification: 'READ',
  displayName: 'Get Fulfillment Order',
  description: 'Get one fulfillment order with its status, holds, location and line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one fulfillment order: status and request status, assigned location, destination, delivery method, active holds (with the hold ids release_fulfillment_order_hold needs), the actions Shopify allows on it right now (supported_actions, for example CREATE_FULFILLMENT, HOLD, MOVE, RELEASE_HOLD) and its line items with remaining quantities, 50 per call: while line_items_truncated is true, call again with line_items_after set to line_items_end_cursor to read the next 50. Destination name, email and phone may be redacted on Basic-plan stores (see redacted_fields). Needs the read_merchant_managed_fulfillment_orders access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: fulfillmentOrderOutputSchema,
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order id, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    line_items_after: Property.ShortText({
      displayName: 'Line Items Cursor',
      description: 'Leave empty for the first 50 line items. To read more, pass line_items_end_cursor from the previous call.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrder: GqlFulfillmentOrder | null;
    }>({
      auth,
      query: `query GetFulfillmentOrder($id: ID!, $lineItemsAfter: String) { fulfillmentOrder(id: $id) { ${shopifyFields.FULFILLMENT_ORDER_PAGED_FIELDS} } }`,
      variables: { id, lineItemsAfter: shopifyValues.nonEmpty(propsValue.line_items_after) },
    });
    if (!data.fulfillmentOrder) {
      throw new Error(`Fulfillment order ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapFulfillmentOrder(data.fulfillmentOrder),
      redacted_fields: redactedFields,
    };
  },
});
