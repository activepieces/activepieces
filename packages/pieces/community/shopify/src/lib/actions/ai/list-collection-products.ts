import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 80;

export const shopifyAiListCollectionProducts = createAction({
  auth: shopifyAuth,
  name: 'list_collection_products',
  classification: 'SEARCH',
  displayName: 'List Collection Products',
  description: 'List the products in a collection, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the products currently in one collection (manual picks and products matching its conditions) as product summaries. With the default sort the collection\'s own sort order is used. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…". Find it with search_collections.',
      required: true,
    }),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the collection\'s own sort order.',
      required: false,
      options: {
        options: [
          { label: 'Collection default', value: 'COLLECTION_DEFAULT' },
          { label: 'Manual', value: 'MANUAL' },
          { label: 'Best selling', value: 'BEST_SELLING' },
          { label: 'Title', value: 'TITLE' },
          { label: 'Price', value: 'PRICE' },
          { label: 'Created', value: 'CREATED' },
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collection: { id: string; products: GqlConnection<GqlProduct> } | null;
    }>({
      auth,
      query: `query ListCollectionProducts($id: ID!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) { collection(id: $id) { id products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.PRODUCT_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
      primaryPaths: ['collection.products'],
    });
    if (!data.collection) {
      throw new Error(`Collection ${id} was not found.`);
    }
    return shopifyMappers.toPage({
      connection: data.collection.products,
      map: shopifyMappers.mapProductSummary,
      redactedFields,
    });
  },
});
