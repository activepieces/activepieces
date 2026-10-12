import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { GqlMarket, marketsFields, marketsMappers } from '../../common/markets';
import { marketOutputSchema } from '../../output-schemas/markets';

export const shopifyAiGetMarket = createAction({
  auth: shopifyAuth,
  name: 'get_market',
  classification: 'READ',
  displayName: 'Get Market',
  description: 'Get one Shopify Market with its conditions, hierarchy, catalogs, currency and return policy.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Market in detail: status, type, the conditions that put a buyer in it (condition_types; up to 100 regions with codes; up to 50 retail locations, company locations and channels, each with an application level of SPECIFIED or ALL), parent_markets and child_markets (up to 50 each, with counts), currency settings (base currency, local currencies, rounding), tax- and duties-inclusive pricing, up to 10 catalogs with their price list (id, name, currency), up to 10 web presences with root URLs per locale, and its return policy profile with the return and edit rules. A *_truncated flag is true when Shopify has more than were returned. Parent and child markets are eventually consistent after a hierarchy change (compare relationships_version from list_market_relationships). Get the market id from list_markets. Needs the read_markets access scope; catalogs and price lists also need read_products, company locations read_companies, return policy read_legal_policies; parts the token cannot read are empty and listed in redacted_fields. Read-only.',
    idempotent: true,
  },
  props: {
    market_id: Property.ShortText({
      displayName: 'Market ID',
      description: 'The market id, numeric or "gid://shopify/Market/…". Find it with list_markets.',
      required: true,
    }),
  },
  outputSchema: marketOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Market', id: propsValue.market_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      market: GqlMarket | null;
    }>({
      auth,
      query: `query GetMarket($id: ID!) { market(id: $id) { ${marketsFields.MARKET_DETAIL_FIELDS} } }`,
      variables: { id },
    });
    if (!data.market) {
      throw new Error(`Market ${id} was not found. Find market ids with list_markets.`);
    }
    return {
      ...marketsMappers.mapMarketDetail(data.market),
      redacted_fields: redactedFields,
    };
  },
});
