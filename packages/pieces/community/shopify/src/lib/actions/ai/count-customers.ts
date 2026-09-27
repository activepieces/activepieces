import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { countOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCountCustomers = createAction({
  auth: shopifyAuth,
  name: 'count_customers',
  classification: 'READ',
  displayName: 'Count Customers',
  description: 'Count customers, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts customers, optionally filtered with search syntax such as "tag:vip" or "orders_count:>0". precision is AT_LEAST when Shopify stopped counting at its limit. Use search_customers to see them. Read-only.',
    idempotent: true,
  },
  outputSchema: countOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify customer search syntax, for example "tag:vip". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      customersCount: GqlCount | null;
    }>({
      auth,
      query: `query CountCustomers($query: String) { customersCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.customersCount?.count ?? 0,
      precision: data.customersCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
