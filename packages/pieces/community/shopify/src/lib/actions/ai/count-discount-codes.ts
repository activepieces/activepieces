import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountDiscountCodes = createAction({
  auth: shopifyAuth,
  name: 'count_discount_codes',
  classification: 'READ',
  displayName: 'Count Discount Codes',
  description: 'Count the redeem codes across the store\'s code discounts, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts redeem codes (the strings customers type) across all code discounts, optionally filtered with search syntax such as "times_used:0". One code discount can hold many codes, so this differs from count_discounts. Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Optional Shopify search syntax on the codes, for example "times_used:0". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountCodesCount: GqlCount | null;
    }>({
      auth,
      query: `query CountDiscountCodes($query: String) { discountCodesCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.discountCodesCount?.count ?? 0,
      precision: data.discountCodesCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
