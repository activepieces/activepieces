import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountAbandonedCheckouts = createAction({
  auth: shopifyAuth,
  name: 'count_abandoned_checkouts',
  classification: 'READ',
  displayName: 'Count Abandoned Checkouts',
  description: 'Count abandoned checkouts, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts abandoned checkouts, optionally filtered with search syntax such as "created_at:>=2026-09-01". precision is AT_LEAST when Shopify stopped counting at its limit. Use list_abandoned_checkouts to see them. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify search syntax, for example "created_at:>=2026-09-01". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      abandonedCheckoutsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountAbandonedCheckouts($query: String) { abandonedCheckoutsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.abandonedCheckoutsCount?.count ?? 0,
      precision: data.abandonedCheckoutsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
