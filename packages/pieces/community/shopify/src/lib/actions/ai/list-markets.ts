import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { GqlMarket, marketsFields, marketsMappers } from '../../common/markets';
import { listMarketsOutputSchema } from '../../output-schemas/markets';

const MAX_PAGE_SIZE = 15;

export const shopifyAiListMarkets = createAction({
  auth: shopifyAuth,
  name: 'list_markets',
  classification: 'SEARCH',
  displayName: 'List Markets',
  description: 'List and search the store\'s Shopify Markets with their hierarchy, regions, currency and return policy.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s Markets (the buyer groups that get their own currency, prices, catalogs, domains and return policy). Use it to find a market id for get_market, to see which countries a market covers, or to see how markets nest. Each item has id (gid://shopify/Market/…), name, handle, status (ACTIVE or DRAFT), type (REGION, LOCATION, COMPANY_LOCATION, CHANNEL or NONE), condition_types, up to 10 regions with their country or subdivision code, up to 10 parent_markets and child_markets (id and name), return_policy_profile_id/name (pass to get_return_policy_profile), base_currency_code, local_currencies and up to 5 web_presences; each *_truncated flag is true when there are more, then call get_market for the full lists. Parent and child markets are eventually consistent after a hierarchy change (see list_market_relationships). Filter with type, or with Shopify search syntax in query: "status:ACTIVE", "name:Europe", "market_type:REGION", "market_condition_types:REGION". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_markets access scope; the return policy fields also need read_legal_policies and are listed in redacted_fields without it. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify markets search syntax, for example "status:ACTIVE", "name:Europe" or "market_type:REGION". Leave empty to list all.'
    ),
    type: shopifyProps.staticChoice({
      displayName: 'Market Type',
      description: 'Only return markets of this type. Leave empty for all types.',
      required: false,
      values: marketsFields.MARKET_TYPES,
    }),
    sort_key: shopifyProps.staticChoice({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to NAME.',
      required: false,
      values: marketsFields.MARKET_SORT_KEYS,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listMarketsOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      markets: GqlConnection<GqlMarket> | null;
    }>({
      auth,
      query: `query ListMarkets($first: Int!, $after: String, $reverse: Boolean, $sortKey: MarketsSortKeys, $query: String, $type: MarketType) { markets(first: $first, after: $after, reverse: $reverse, sortKey: $sortKey, query: $query, type: $type) { nodes { ${marketsFields.MARKET_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
        sortKey: shopifyValues.nonEmpty(propsValue.sort_key),
        query: shopifyValues.nonEmpty(propsValue.query),
        type: shopifyValues.nonEmpty(propsValue.type),
      },
    });
    return shopifyMappers.toPage({
      connection: data.markets,
      map: marketsMappers.mapMarketSummary,
      redactedFields,
    });
  },
});
