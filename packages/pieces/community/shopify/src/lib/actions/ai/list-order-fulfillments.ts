import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  GqlFulfillment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listOrderFulfillmentsOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiListOrderFulfillments = createAction({
  auth: shopifyAuth,
  name: 'list_order_fulfillments',
  classification: 'SEARCH',
  displayName: 'List Order Fulfillments',
  description: 'List the fulfillments (shipments) of an order with their tracking.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the fulfillments (shipments already recorded) of one order, up to 50, with status, shipment status, tracking company, numbers and URLs, location and dates. Returns the list in one call (no paging): total_count is Shopify\'s count of fulfillments on the order, and truncated=true means total_count is larger than the number returned, so only the first 50 are listed. Use get_fulfillment_details for the shipped line items of one fulfillment. Needs the read_orders access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listOrderFulfillmentsOutputSchema,
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: { id: string; fulfillmentsCount?: GqlCount | null; fulfillments?: GqlFulfillment[] | null } | null;
    }>({
      auth,
      query: `query ListOrderFulfillments($id: ID!) { order(id: $id) { id fulfillmentsCount { count } fulfillments(first: ${FULFILLMENT_LIMIT}) { ${shopifyFields.FULFILLMENT_SUMMARY_FIELDS} } } }`,
      variables: { id },
      primaryPaths: ['order.fulfillments'],
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    const items = (data.order.fulfillments ?? []).map(shopifyMappers.mapFulfillmentSummary);
    const totalCount = data.order.fulfillmentsCount?.count ?? null;
    return {
      order_id: data.order.id,
      items,
      count: items.length,
      total_count: totalCount,
      truncated: totalCount === null ? items.length === FULFILLMENT_LIMIT : totalCount > items.length,
      redacted_fields: redactedFields,
    };
  },
});

const FULFILLMENT_LIMIT = 50;
