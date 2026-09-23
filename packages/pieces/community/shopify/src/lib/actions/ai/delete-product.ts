import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteProduct = createAction({
  auth: shopifyAuth,
  name: 'delete_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product',
  description: 'Permanently delete a product with all its variants and media.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one product together with all its variants and inventory items. Its media files are deleted too, unless another product also uses them. Cannot be undone; to hide a product instead, set its status to ARCHIVED or DRAFT with update_product_fields. A repeat call fails because the product is gone.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productDelete: { deletedProductId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteProduct($input: ProductDeleteInput!) { productDelete(input: $input, synchronous: true) { deletedProductId userErrors { field message } } }`,
      variables: { input: { id } },
    });
    return {
      deleted_product_id: data.productDelete?.deletedProductId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
