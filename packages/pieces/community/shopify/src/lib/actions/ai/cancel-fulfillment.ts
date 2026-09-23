import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiCancelFulfillment = createAction({
  auth: shopifyAuth,
  name: 'cancel_fulfillment',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Fulfillment',
  description: 'Cancel a fulfillment so its items become unfulfilled again.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancels one fulfillment (a shipment already recorded) and returns it with status CANCELLED. Shopify reverses it on the fulfillment orders: the cancelled items get new fulfillment orders so they can be fulfilled again (at the original location when still stocked there, otherwise by the store\'s fulfillment priority). Tracking on the cancelled fulfillment stops being shown to the customer. Cannot be undone; a repeat call fails because the fulfillment is already cancelled. The required access scope is not documented for this mutation (write_merchant_managed_fulfillment_orders is expected).',
    idempotent: false,
  },
  props: {
    fulfillment_id: Property.ShortText({
      displayName: 'Fulfillment ID',
      description:
        'The fulfillment to cancel, numeric or "gid://shopify/Fulfillment/…". Find it with list_order_fulfillments.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Fulfillment', id: propsValue.fulfillment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillmentCancel: { fulfillment: GqlFulfillment | null } | null;
    }>({
      auth,
      query: `mutation CancelFulfillment($id: ID!) { fulfillmentCancel(id: $id) { fulfillment { ${shopifyFields.FULFILLMENT_SUMMARY_FIELDS} } userErrors { field message } } }`,
      variables: { id },
    });
    const fulfillment = data.fulfillmentCancel?.fulfillment;
    if (!fulfillment) {
      throw new Error('Shopify did not return the cancelled fulfillment.');
    }
    return {
      ...shopifyMappers.mapFulfillmentSummary(fulfillment),
      redacted_fields: redactedFields,
    };
  },
});
