import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlVariant,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { variantListOutputSchema } from '../../output-schemas/products';

export const shopifyAiUpdateProductVariants = createAction({
  auth: shopifyAuth,
  name: 'update_product_variants',
  classification: 'WRITE',
  displayName: 'Update Product Variants',
  description: 'Change the price, SKU, barcode, stock policy or option values of one or more variants of a product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one or many variants of the same product in one call; fields left empty are not sent and keep their values. All-or-nothing: if any variant is invalid, nothing is changed. Stock quantities are not changed here; use set_inventory_quantities or adjust_inventory_quantities. Variant ids come from list_product_variants. Re-running with the same values is safe.',
    idempotent: true,
  },
  outputSchema: variantListOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product the variants belong to, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    variants: shopifyProps.variants({ mode: 'update' }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const variants = shopifyValues.buildVariantInputs({ value: propsValue.variants, mode: 'update' });
    if (variants.length === 0) {
      throw new Error('Provide at least one variant to update.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariantsBulkUpdate: { productVariants: GqlVariant[] | null; product: { id: string } | null } | null;
    }>({
      auth,
      query: `mutation UpdateProductVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: false) { product { id } productVariants { ${shopifyFields.VARIANT_FIELDS} } userErrors { field message code } } }`,
      variables: { productId, variants },
    });
    const items = (data.productVariantsBulkUpdate?.productVariants ?? []).map(shopifyMappers.mapVariant);
    return {
      product_id: data.productVariantsBulkUpdate?.product?.id ?? productId,
      variants: items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
