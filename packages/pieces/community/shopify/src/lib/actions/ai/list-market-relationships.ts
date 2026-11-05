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
import { GqlMarketRelationship, marketsFields, marketsMappers } from '../../common/markets';
import { listMarketRelationshipsOutputSchema } from '../../output-schemas/markets';

const MAX_PAGE_SIZE = 100;

export const shopifyAiListMarketRelationships = createAction({
  auth: shopifyAuth,
  name: 'list_market_relationships',
  classification: 'READ',
  displayName: 'List Market Relationships',
  description: 'List the parent/child links between the store\'s Markets.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every parent/child link between the store\'s Markets in one flat list, so you can rebuild the whole market tree without calling get_market per market. Each item has the relationship id and the parent_market_id/name/handle and child_market_id/name/handle (parent fields can be empty). Shopify rebuilds these links in the background after a market, its conditions or its regions change, so right after such a change the list can still show the old hierarchy: relationships_version identifies the build that was read; read again later and compare it with a previous value to know whether the rebuild has landed. Market ids work with get_market. Paged: pass end_cursor back as the cursor while has_next_page is true; keep the same relationships_version across pages, and if it changes while paging, start over. Needs the read_markets access scope. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listMarketRelationshipsOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketRelationships: GqlConnection<GqlMarketRelationship> | null;
      marketRelationshipsStatus: { version?: string | null } | null;
    }>({
      auth,
      query: `query ListMarketRelationships($first: Int!, $after: String, $reverse: Boolean) { marketRelationshipsStatus { version } marketRelationships(first: $first, after: $after, reverse: $reverse) { nodes { ${marketsFields.MARKET_RELATIONSHIP_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return {
      ...shopifyMappers.toPage({
        connection: data.marketRelationships,
        map: marketsMappers.mapMarketRelationship,
        redactedFields,
      }),
      relationships_version: data.marketRelationshipsStatus?.version ?? null,
    };
  },
});
