import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountDiscounts = createAction({
  auth: shopifyAuth,
  name: 'count_discounts',
  classification: 'READ',
  displayName: 'Count Discounts',
  description: 'Count discounts (code and automatic), optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts the store\'s discounts, code and automatic, optionally filtered with search syntax such as "status:active" or "method:automatic". This counts discounts, not redeem codes (use count_discount_codes for codes). Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify discount search syntax, for example "status:active method:code". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountNodesCount: GqlCount | null;
    }>({
      auth,
      query: `query CountDiscounts($query: String) { discountNodesCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.discountNodesCount?.count ?? 0,
      precision: data.discountNodesCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
