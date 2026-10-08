import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlVariant,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { variantListOutputSchema } from '../../output-schemas/products';

export const shopifyAiReorderProductVariants = createAction({
  auth: shopifyAuth,
  name: 'reorder_product_variants',
  classification: 'WRITE',
  displayName: 'Reorder Product Variants',
  description: 'Move variants of a product to new positions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves variants of one product to absolute positions (1 is first). Variants not listed shift around the moved ones. Returns the product\'s first 100 variants in their new order. Sending the same positions again is safe.',
    idempotent: true,
  },
  outputSchema: variantListOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    positions: Property.Array({
      displayName: 'New Positions',
      description: 'The variants to move and where.',
      required: true,
      properties: {
        variant_id: Property.ShortText({
          displayName: 'Variant ID',
          description: 'The variant id, numeric or "gid://shopify/ProductVariant/…".',
          required: true,
        }),
        position: Property.Number({
          displayName: 'Position',
          description: 'New position, starting at 1.',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const positions = shopifyValues.readRecords(propsValue.positions).map((item) => {
      const variantId = shopifyValues.readText(item['variant_id']);
      const position = shopifyValues.readNumber(item['position']);
      if (!variantId || position === undefined || !Number.isInteger(position) || position < 1) {
        throw new Error('Every entry needs a variant_id and a whole-number position of at least 1.');
      }
      return { id: shopifyGraphqlClient.toGid({ type: 'ProductVariant', id: variantId }), position };
    });
    if (positions.length === 0) {
      throw new Error('Provide at least one variant position.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productVariantsBulkReorder: { product: { id: string; variants: GqlConnection<GqlVariant> } | null } | null;
    }>({
      auth,
      query: `mutation ReorderProductVariants($productId: ID!, $positions: [ProductVariantPositionInput!]!) { productVariantsBulkReorder(productId: $productId, positions: $positions) { product { id variants(first: 100, sortKey: POSITION) { nodes { ${shopifyFields.VARIANT_FIELDS} } } } userErrors { field message code } } }`,
      variables: { productId, positions },
    });
    const items = (data.productVariantsBulkReorder?.product?.variants?.nodes ?? []).map(shopifyMappers.mapVariant);
    return {
      product_id: data.productVariantsBulkReorder?.product?.id ?? productId,
      variants: items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
