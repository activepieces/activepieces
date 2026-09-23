import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiCancelFulfillmentOrder = createAction({
  auth: shopifyAuth,
  name: 'cancel_fulfillment_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Fulfillment Order',
  description: 'Cancel a fulfillment order that was sent to a fulfillment service; a replacement is created.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels one fulfillment order and closes it; Shopify creates replacement_fulfillment_order for the work still to be done. Works only when the fulfillment order was sent to a fulfillment service and its request_status is SUBMITTED (cancelled at once) or CANCELLATION_REQUESTED; for other states Shopify returns an error. A service that already accepted the request may still ship. This does not cancel the order itself (use start_order_cancellation for that). Cannot be undone; a repeat call fails because the fulfillment order is closed. Needs the write_merchant_managed_fulfillment_orders access scope.',
    idempotent: false,
  },
  props: {
    fulfillment_order_id: Property.ShortText({
      displayName: 'Fulfillment Order ID',
      description:
        'The fulfillment order to cancel, numeric or "gid://shopify/FulfillmentOrder/…". Find it with list_order_fulfillment_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'FulfillmentOrder', id: propsValue.fulfillment_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentOrderCancel: {
        fulfillmentOrder: GqlFulfillmentOrder | null;
        replacementFulfillmentOrder: GqlFulfillmentOrder | null;
      } | null;
    }>({
      auth,
      query: `mutation CancelFulfillmentOrder($id: ID!) { fulfillmentOrderCancel(id: $id) { fulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } replacementFulfillmentOrder { ${shopifyFields.FULFILLMENT_ORDER_FIELDS} } userErrors { field message } } }`,
      variables: { id },
    });
    const payload = data.fulfillmentOrderCancel;
    return {
      fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.fulfillmentOrder),
      replacement_fulfillment_order: shopifyMappers.mapFulfillmentOrderOrNull(payload?.replacementFulfillmentOrder),
      redacted_fields: redactedFields,
    };
  },
});
