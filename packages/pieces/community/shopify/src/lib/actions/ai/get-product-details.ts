import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetProductDetails = createAction({
  auth: shopifyAuth,
  name: 'get_product_details',
  classification: 'READ',
  displayName: 'Get Product',
  description: 'Get one product with its options, variants and media.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one product by id: title, status, vendor, type, tags, price range, SEO, its options with their values, the first 100 variants (price, SKU, stock, option values, inventory item id) and the first 50 media items. Use search_products to find a product by title, SKU, vendor or tag first. Read-only.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description:
        'The product id: a numeric id such as "632910392" or a full id such as "gid://shopify/Product/632910392". Find it with search_products.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      product: GqlProduct | null;
    }>({
      auth,
      query: `query GetProductDetails($id: ID!) { product(id: $id) { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } }`,
      variables: { id },
    });
    if (!data.product) {
      throw new Error(`Product ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapProductDetail(data.product),
      redacted_fields: redactedFields,
    };
  },
});
