import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMarketingEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListMarketingEvents = createAction({
  auth: shopifyAuth,
  name: 'list_marketing_events',
  classification: 'SEARCH',
  displayName: 'List Marketing Events',
  description: 'List marketing events (campaigns, ads, emails) recorded on the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists marketing events: the campaigns, ads, emails and posts that marketing apps recorded on the store, each with its tactic, channel, UTM values, start/end times and the app it belongs to. Shopify documents this list as the events "associated with the marketing app", so a custom-app token may only see the events it created itself (for example with upsert_external_marketing_activity), not those of other marketing apps; an empty list does not prove the store runs no marketing. Filter with Shopify search syntax such as "type:AD", "started_at:>2026-01-01" or "description:spring". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_marketing_events access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify marketing event search syntax, for example "type:AD", "app_id:123" or "started_at:>2026-01-01". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Start time', value: 'STARTED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingEvents: GqlConnection<GqlMarketingEvent>;
    }>({
      auth,
      query: `query ListMarketingEvents($first: Int!, $after: String, $query: String, $sortKey: MarketingEventSortKeys, $reverse: Boolean) { marketingEvents(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.MARKETING_EVENT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.marketingEvents,
      map: shopifyMappers.mapMarketingEvent,
      redactedFields,
    });
  },
});
