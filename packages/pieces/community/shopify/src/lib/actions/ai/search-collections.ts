import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiSearchCollections = createAction({
  auth: shopifyAuth,
  name: 'search_collections',
  classification: 'SEARCH',
  displayName: 'Search Collections',
  description: 'Search collections with Shopify search syntax, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches collections with Shopify search syntax (for example "title:Summer*", "handle:summer-sale", "collection_type:custom" for manual collections or "collection_type:smart" for rule-based ones) and returns one page of collection summaries with product counts. Use get_collection for sources and conditions. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify collection search syntax, for example "title:Summer*" or "collection_type:smart". Leave empty to list all collections.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the collection id.',
      required: false,
      options: {
        options: [
          { label: 'Title', value: 'TITLE' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collections: GqlConnection<GqlCollection>;
    }>({
      auth,
      query: `query SearchCollections($first: Int!, $after: String, $query: String, $sortKey: CollectionSortKeys, $reverse: Boolean) { collections(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.COLLECTION_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.collections,
      map: shopifyMappers.mapCollectionSummary,
      redactedFields,
    });
  },
});
