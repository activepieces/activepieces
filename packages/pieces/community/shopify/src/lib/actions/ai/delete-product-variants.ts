import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiDeleteProductVariants = createAction({
  auth: shopifyAuth,
  name: 'delete_product_variants',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Product Variants',
  description: 'Permanently delete one or more variants of a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes variants of one product, together with their inventory items and stock. A product always keeps at least one variant. Cannot be undone; a repeat call fails because the variants are gone. Variant ids come from list_product_variants.',
    idempotent: false,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product the variants belong to, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    variant_ids: Property.Array({
      displayName: 'Variant IDs',
      description: 'Ids of the variants to delete, numeric or "gid://shopify/ProductVariant/…".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const variantsIds = shopifyValues.toGidList({ type: 'ProductVariant', value: propsValue.variant_ids });
    if (!variantsIds) {
      throw new Error('Provide at least one variant id to delete.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariantsBulkDelete: { product: { id: string } | null } | null;
    }>({
      auth,
      query: `mutation DeleteProductVariants($productId: ID!, $variantsIds: [ID!]!) { productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) { product { id } userErrors { field message code } } }`,
      variables: { productId, variantsIds },
    });
    return {
      product_id: data.productVariantsBulkDelete?.product?.id ?? productId,
      deleted_variant_ids: variantsIds,
      redacted_fields: redactedFields,
    };
  },
});
