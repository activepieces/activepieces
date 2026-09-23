import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiMoveFulfillmentOrder = createAction({
  auth: shopifyAuth,
  name: 'move_fulfillment_order',
  classification: 'WRITE',
  displayName: 'Move Fulfillment Order',
  description: 'Ship a fulfillment order (or some of its items) from a different location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves one fulfillment order, or some of its items, to another location that will ship them. Check first with list_fulfillment_order_move_locations which locations are movable. Leave line_items empty to move everything; with line_items only those quantities move and Shopify splits the fulfillment order. Returns moved_fulfillment_order (now at the new location), original_fulfillment_order and remaining_fulfillment_order (what stayed behind, if any). Each call moves again, so do not repeat it after a success. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: false,
  },
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order to move, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
    new_location_id: Property.ShortText({
      displayName: 'New Location ID',
      description:
        'The location that should ship the items, numeric or "gid://shopify/Location/…". Find a movable one with list_fulfillment_order_move_locations.',
      required: true,
    }),
    line_items: shopifyProps.fulfillmentOrderLineItems({
      description:
        'Optional partial move: the fulfillment order line items and quantities to move. Leave empty to move the whole fulfillment order.',
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const newLocationId = shopifyGraphqlClient.toGid({ type: 'Location', id: propsValue.new_location_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrderMove: {
        movedFulfillmentOrder: GqlFulfillmentOrder | null;
        originalFulfillmentOrder: GqlFulfillmentOrder | null;
        remainingFulfillmentOrder: GqlFulfillmentOrder | null;
      } | null;
    }>({
      auth,
      query: `mutation MoveFulfillmentOrder($id: ID!, $newLocationId: ID!, $fulfillmentOrderLineItems: [FulfillmentOrderLineItemInput!]) { fulfillmentOrderMove(id: $id, newLocationId: $newLocationId, fulfillmentOrderLineItems: $fulfillmentOrderLineItems) { movedFulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } originalFulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } remainingFulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } userErrors { field message code } } }`,
      variables: {
        id,
        newLocationId,
        fulfillmentOrderLineItems: shopifyValues.buildFulfillmentOrderLineItems(propsValue.line_items),
      },
    });
    const payload = data.fulfillmentOrderMove;
    return {
      moved_fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.movedFulfillmentOrder),
      original_fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.originalFulfillmentOrder),
      remaining_fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.remainingFulfillmentOrder),
      redacted_fields: redactedFields,
    };
  },
});
