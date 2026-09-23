import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlGiftCard,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 110;

export const shopifyAiSearchGiftCards = createAction({
  auth: shopifyAuth,
  name: 'search_gift_cards',
  classification: 'SEARCH',
  displayName: 'Search Gift Cards',
  description: 'Search gift cards by status, balance, customer, code ending and more.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the store\'s gift cards with Shopify search syntax, for example "status:enabled", "balance_status:partial", "last_characters:1234", "customer_id:123" or "created_at:>2026-01-01". Returns balance, initial value, status, expiry, owner and the last characters of each code (never the full code). Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_gift_cards access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify gift card search syntax, for example "status:enabled balance_status:partial" or "last_characters:1234". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Balance', value: 'BALANCE' },
          { label: 'Initial value', value: 'INITIAL_VALUE' },
          { label: 'Amount spent', value: 'AMOUNT_SPENT' },
          { label: 'Expires on', value: 'EXPIRES_ON' },
          { label: 'Disabled at', value: 'DISABLED_AT' },
          { label: 'Customer name', value: 'CUSTOMER_NAME' },
          { label: 'Code', value: 'CODE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      giftCards: GqlConnection<GqlGiftCard>;
    }>({
      auth,
      query: `query SearchGiftCards($first: Int!, $after: String, $query: String, $sortKey: GiftCardSortKeys, $reverse: Boolean) { giftCards(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.GIFT_CARD_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.giftCards,
      map: shopifyMappers.mapGiftCard,
      redactedFields,
    });
  },
});
