import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlEvent,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListEvents = createAction({
  auth: shopifyAuth,
  name: 'list_events',
  classification: 'SEARCH',
  displayName: 'List Store Events',
  description: 'List or search the store\'s activity log (who created, changed or deleted what).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists store events, the activity log that records actions such as creating, updating, publishing or deleting products, orders, customers, collections, discounts, pages and blog content, plus staff timeline comments. Each event has its action, message, subject id and type (for basic events), the app that caused it and a timestamp. Filter with Shopify search syntax: "action:\'destroy\' AND subject_type:\'PRODUCT\'" finds deleted products, "created_at:>2026-09-01" limits the time, "comments:false" leaves out staff comments. No dedicated access scope is documented; the read scope of each subject type is expected to apply (for example read_products for product events; not yet confirmed on a store). Paged: pass end_cursor back as the cursor while has_next_page is true. Use count_events for a total. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify event search syntax, for example "action:\'destroy\' AND subject_type:\'PRODUCT\'" or "created_at:>2026-09-01". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Created at', value: 'CREATED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      events: GqlConnection<GqlEvent> | null;
    }>({
      auth,
      query: `query ListEvents($first: Int!, $after: String, $query: String, $sortKey: EventSortKeys, $reverse: Boolean) { events(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.EVENT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.events,
      map: shopifyMappers.mapEvent,
      redactedFields,
    });
  },
});
