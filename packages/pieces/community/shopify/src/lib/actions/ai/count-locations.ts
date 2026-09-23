import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountLocations = createAction({
  auth: shopifyAuth,
  name: 'count_locations',
  classification: 'READ',
  displayName: 'Count Locations',
  description: 'Count the store\'s locations, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts the store\'s locations, optionally filtered with search syntax such as "name:Warehouse*". precision is AT_LEAST when Shopify stopped counting at its limit. Use list_locations to see them. Needs the read_locations access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify location search syntax, for example "name:Warehouse*". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      locationsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountLocations($query: String) { locationsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.locationsCount?.count ?? 0,
      precision: data.locationsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
