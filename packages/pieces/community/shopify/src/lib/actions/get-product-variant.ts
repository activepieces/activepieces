import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProductVariant } from '../common';

export const getProductVariantAction = createAction({
  auth: shopifyAuth,
  name: 'get_product_variant',
  displayName: 'Get Product Variant',
  description: `Get a product variant.`,
  audience: 'both',
  aiMetadata: { description: 'Fetch a single product variant by its variant ID, returning details like price, SKU, and inventory item. Use when you have a specific variant ID; to find variants browse products first via Get Products. Read-only and idempotent.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Product Variant',
      description: 'The ID of the product variant.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id } = propsValue;

    return await getProductVariant(+id, auth);
  },
});
