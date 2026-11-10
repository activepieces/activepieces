import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { productCountOutputSchema } from '../../output-schemas/products';

export const shopifyAiCountProducts = createAction({
  auth: shopifyAuth,
  name: 'count_products',
  classification: 'READ',
  displayName: 'Count Products',
  description: 'Count products, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts products, optionally filtered with search syntax such as "status:active" or "vendor:Nike". precision is AT_LEAST when Shopify stopped counting at its limit. Use search_products to see them. Read-only.',
    idempotent: true,
  },
  outputSchema: productCountOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify product search syntax, for example "status:active" or "tag:sale". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountProducts($query: String) { productsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.productsCount?.count ?? 0,
      precision: data.productsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
