import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { countOutputSchema } from '../../output-schemas/orders';

export const shopifyAiCountDraftOrders = createAction({
  auth: shopifyAuth,
  name: 'count_draft_orders',
  classification: 'READ',
  displayName: 'Count Draft Orders',
  description: 'Count draft orders, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts draft orders, optionally filtered with search syntax such as "status:open". precision is AT_LEAST when Shopify stopped counting at its limit. Use list_draft_orders to see them. Read-only.',
    idempotent: true,
  },
  outputSchema: countOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify draft order search syntax, for example "status:open". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrdersCount: GqlCount | null;
    }>({
      auth,
      query: `query CountDraftOrders($query: String) { draftOrdersCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.draftOrdersCount?.count ?? 0,
      precision: data.draftOrdersCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
