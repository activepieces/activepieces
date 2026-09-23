import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 4;

export const shopifyAiListOrderFulfillmentOrders = createAction({
  auth: shopifyAuth,
  name: 'list_order_fulfillment_orders',
  classification: 'SEARCH',
  displayName: 'List Order Fulfillment Orders',
  description: 'List the fulfillment orders of an order: what still has to be shipped, from which location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the fulfillment orders of one order. Each fulfillment order groups the items to ship from one location and carries its status (OPEN, IN_PROGRESS, ON_HOLD, SCHEDULED, CLOSED, CANCELLED), holds, supported actions and line items with remaining quantities (up to 50 per fulfillment order; line_items_truncated tells when there are more). Call this before create_fulfillment, hold_fulfillment_order or move_fulfillment_order: those take the fulfillment order id and the fulfillment order line item ids from here, not the order line item ids. Destination name, email and phone may be redacted on Basic-plan stores (see redacted_fields). Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_merchant_managed_fulfillment_orders access scope. Read-only.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    query: shopifyProps.searchQuery(
      'Optional Shopify search syntax on the fulfillment orders, for example "status:open". Leave empty to list all.'
    ),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: { id: string; fulfillmentOrders?: GqlConnection<GqlFulfillmentOrder> | null } | null;
    }>({
      auth,
      query: `query ListOrderFulfillmentOrders($id: ID!, $first: Int!, $after: String, $query: String) { order(id: $id) { id fulfillmentOrders(first: $first, after: $after, query: $query) { nodes { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
      },
      primaryPaths: ['order.fulfillmentOrders'],
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    return {
      order_id: data.order.id,
      ...shopifyMappers.toPage({
        connection: data.order.fulfillmentOrders,
        map: shopifyMappers.mapFulfillmentOrder,
        redactedFields,
      }),
    };
  },
});
