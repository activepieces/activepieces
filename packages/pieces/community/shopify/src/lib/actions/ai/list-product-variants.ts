import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlVariant,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 130;

export const shopifyAiListProductVariants = createAction({
  auth: shopifyAuth,
  name: 'list_product_variants',
  classification: 'SEARCH',
  displayName: 'List Product Variants',
  description: 'List the variants of one product, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the variants of one product with price, SKU, stock, option values and inventory item id. Paged: pass end_cursor back as the cursor while has_next_page is true. Use get_product_variant_details for a single variant. Read-only.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to position.',
      required: false,
      options: {
        options: [
          { label: 'Position', value: 'POSITION' },
          { label: 'Title', value: 'TITLE' },
          { label: 'SKU', value: 'SKU' },
          { label: 'Inventory quantity', value: 'INVENTORY_QUANTITY' },
          { label: 'ID', value: 'ID' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      product: { id: string; variants: GqlConnection<GqlVariant> } | null;
    }>({
      auth,
      query: `query ListProductVariants($id: ID!, $first: Int!, $after: String, $sortKey: ProductVariantSortKeys, $reverse: Boolean) { product(id: $id) { id variants(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.VARIANT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
      primaryPaths: ['product.variants'],
    });
    if (!data.product) {
      throw new Error(`Product ${id} was not found.`);
    }
    return shopifyMappers.toPage({
      connection: data.product.variants,
      map: shopifyMappers.mapVariant,
      redactedFields,
    });
  },
});
