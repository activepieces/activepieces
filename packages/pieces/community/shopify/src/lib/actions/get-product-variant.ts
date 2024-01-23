import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProductVariant } from '../common';

export const getProductVariantAction = createAction({
  auth: shopifyAuth,
  name: 'get_product_variant',
  displayName: 'Get Product Variant',
  description: `Get a product variant.`,
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
