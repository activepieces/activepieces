import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCountGiftCards = createAction({
  auth: shopifyAuth,
  name: 'count_gift_cards',
  classification: 'READ',
  displayName: 'Count Gift Cards',
  description: 'Count gift cards, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts the store\'s gift cards (enabled, disabled and fully redeemed alike), optionally filtered with search syntax such as "status:enabled". Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Use search_gift_cards to see them. Needs the read_gift_cards access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify gift card search syntax, for example "status:enabled". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCardsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountGiftCards($query: String) { giftCardsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.giftCardsCount?.count ?? 0,
      precision: data.giftCardsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
