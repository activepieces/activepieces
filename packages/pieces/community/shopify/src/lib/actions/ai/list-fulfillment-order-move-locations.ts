import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlCount,
  GqlRef,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listFulfillmentOrderMoveLocationsOutputSchema } from '../../output-schemas/fulfillment';

const MAX_PAGE_SIZE = 200;

export const shopifyAiListFulfillmentOrderMoveLocations = createAction({
  auth: shopifyAuth,
  name: 'list_fulfillment_order_move_locations',
  classification: 'SEARCH',
  displayName: 'List Fulfillment Order Move Locations',
  description: 'List the locations a fulfillment order could be moved to, and whether each one can take it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists candidate locations for moving one fulfillment order. For each location: movable (true when move_fulfillment_order will accept it), a message explaining why not, and how many of the line items it can and cannot stock. Optionally narrow by location name search or by fulfillment order line item ids. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_merchant_managed_fulfillment_orders access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listFulfillmentOrderMoveLocationsOutputSchema,
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order to move, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    query: shopifyProps.searchQuery(
      'Optional location search, for example "name:Warehouse*". Leave empty to list all candidates.'
    ),
    line_item_ids: Property.Array({
      displayName: 'Fulfillment Order Line Item IDs',
      description:
        'Optional: only check these fulfillment order line items (line_items[].id from get_fulfillment_order). Leave empty to check all.',
      required: false,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrder: { id: string; locationsForMove?: GqlConnection<GqlLocationForMove> | null } | null;
    }>({
      auth,
      query: `query ListFulfillmentOrderMoveLocations($id: ID!, $first: Int!, $after: String, $query: String, $lineItemIds: [ID!]) { fulfillmentOrder(id: $id) { id locationsForMove(first: $first, after: $after, query: $query, lineItemIds: $lineItemIds) { nodes { movable message location { id name } availableLineItemsCount { count } unavailableLineItemsCount { count } } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        lineItemIds: shopifyValues.toGidList({ type: 'FulfillmentOrderLineItem', value: propsValue.line_item_ids }),
      },
      primaryPaths: ['fulfillmentOrder.locationsForMove'],
    });
    if (!data.fulfillmentOrder) {
      throw new Error(`Fulfillment order ${id} was not found.`);
    }
    return {
      fulfillment_order_id: data.fulfillmentOrder.id,
      ...shopifyMappers.toPage({
        connection: data.fulfillmentOrder.locationsForMove,
        map: mapLocationForMove,
        redactedFields,
      }),
    };
  },
});

function mapLocationForMove(entry: GqlLocationForMove) {
  return {
    location_id: entry.location?.id ?? null,
    location_name: entry.location?.name ?? null,
    movable: entry.movable ?? null,
    message: entry.message ?? null,
    available_line_items_count: entry.availableLineItemsCount?.count ?? null,
    unavailable_line_items_count: entry.unavailableLineItemsCount?.count ?? null,
  };
}

type GqlLocationForMove = {
  movable?: boolean | null;
  message?: string | null;
  location?: GqlRef | null;
  availableLineItemsCount?: GqlCount | null;
  unavailableLineItemsCount?: GqlCount | null;
};
