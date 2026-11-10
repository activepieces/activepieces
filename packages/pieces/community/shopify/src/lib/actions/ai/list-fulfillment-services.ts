import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlFulfillmentService,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listFulfillmentServicesOutputSchema } from '../../output-schemas/fulfillment';

export const shopifyAiListFulfillmentServices = createAction({
  auth: shopifyAuth,
  name: 'list_fulfillment_services',
  classification: 'SEARCH',
  displayName: 'List Fulfillment Services',
  description: 'List the fulfillment services installed on the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s fulfillment services (third-party warehouses, gift card and manual services) with handle, name, type, callback URL, whether they manage inventory or support tracking, and the location each one uses. Returns the full list in one call (no paging). Needs the read_fulfillments access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listFulfillmentServicesOutputSchema,
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shop: { fulfillmentServices?: GqlFulfillmentService[] | null } | null;
    }>({
      auth,
      query: `query ListFulfillmentServices { shop { fulfillmentServices { ${shopifyFields.FULFILLMENT_SERVICE_FIELDS} } } }`,
      primaryPaths: ['shop.fulfillmentServices'],
    });
    const items = (data.shop?.fulfillmentServices ?? []).map(shopifyMappers.mapFulfillmentService);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
