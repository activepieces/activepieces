import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetFulfillmentOrder = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment_order',
  classification: 'READ',
  displayName: 'Get Fulfillment Order',
  description: 'Get one fulfillment order with its status, holds, location and line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one fulfillment order: status and request status, assigned location, destination, delivery method, active holds (with the hold ids release_fulfillment_order_hold needs), the actions Shopify allows on it right now (supported_actions, for example CREATE_FULFILLMENT, HOLD, MOVE, RELEASE_HOLD) and up to 50 line items with remaining quantities. Destination name, email and phone may be redacted on Basic-plan stores (see redacted_fields). Needs the read_merchant_managed_fulfillment_orders access scope. Read-only.',
    idempotent: true,
  },
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order id, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrder: GqlFulfillmentOrder | null;
    }>({
      auth,
      query: `query GetFulfillmentOrder($id: ID!) { fulfillmentOrder(id: $id) { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } }`,
      variables: { id },
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
