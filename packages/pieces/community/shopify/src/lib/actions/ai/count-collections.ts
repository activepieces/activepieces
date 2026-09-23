import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountCollections = createAction({
  auth: shopifyAuth,
  name: 'count_collections',
  classification: 'READ',
  displayName: 'Count Collections',
  description: 'Count collections, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts collections, optionally filtered with search syntax such as "collection_type:smart" or "title:Summer*". precision is AT_LEAST when Shopify stopped counting at its limit. Use search_collections to see them. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify collection search syntax, for example "collection_type:custom". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountCollections($query: String) { collectionsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.collectionsCount?.count ?? 0,
      precision: data.collectionsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
