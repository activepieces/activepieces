import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetFulfillmentDetails = createAction({
  auth: shopifyAuth,
  name: 'get_fulfillment_details',
  classification: 'READ',
  displayName: 'Get Fulfillment Details',
  description: 'Get one fulfillment with its tracking, origin address and shipped line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one fulfillment (a recorded shipment): status, shipment status (display_status), tracking company, numbers and URLs, dates (in transit, delivered, estimated delivery), location, fulfillment service, origin address and up to 50 shipped line items with quantities (line_items_truncated tells when there are more). Needs the read_orders access scope. Read-only.',
    idempotent: true,
  },
  props: {
    fulfillment_id: Property.ShortText({
      displayName: 'Fulfillment ID',
      description:
        'The fulfillment id, numeric or "gid://shopify/Fulfillment/…". Find it with list_order_fulfillments.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Fulfillment', id: propsValue.fulfillment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fulfillment: GqlFulfillment | null;
    }>({
      auth,
      query: `query GetFulfillment($id: ID!) { fulfillment(id: $id) { ${shopifyFields.FULFILLMENT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.fulfillment) {
      throw new Error(`Fulfillment ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapFulfillment(data.fulfillment),
      redacted_fields: redactedFields,
    };
  },
});
