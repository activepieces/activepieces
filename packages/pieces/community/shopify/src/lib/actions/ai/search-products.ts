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
import { searchProductsOutputSchema } from '../../output-schemas/products';

const MAX_PAGE_SIZE = 80;

export const shopifyAiSearchProducts = createAction({
  auth: shopifyAuth,
  name: 'search_products',
  classification: 'SEARCH',
  displayName: 'Search Products',
  description: 'Search products with Shopify search syntax, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches products with Shopify search syntax (for example "title:*shirt*", "sku:TSHIRT-RED-L", "vendor:Nike", "tag:sale", "status:active" or "product_type:Shoes") and returns one page of product summaries with price range, inventory total and variant count. Use get_product_details for options, variants and media. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  outputSchema: searchProductsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify product search syntax, for example "title:*shirt*", "sku:TSHIRT-RED-L", "vendor:Nike" or "status:draft". Leave empty to list all products.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the product id.',
      required: false,
      options: {
        options: [
          { label: 'Title', value: 'TITLE' },
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
          { label: 'Published at', value: 'PUBLISHED_AT' },
          { label: 'Inventory total', value: 'INVENTORY_TOTAL' },
          { label: 'Product type', value: 'PRODUCT_TYPE' },
          { label: 'Vendor', value: 'VENDOR' },
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
      products: GqlConnection<GqlProduct>;
    }>({
      auth,
      query: `query SearchProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) { products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.PRODUCT_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.products,
      map: shopifyMappers.mapProductSummary,
      redactedFields,
    });
  },
});
