import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProduct } from '../common';

export const getProductAction = createAction({
  auth: shopifyAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: `Get existing product.`,
  audience: 'both',
  aiMetadata: { description: 'Look up a single product by its product ID. Read-only and repeatable; use to fetch the details of one known product rather than to search or list products.', idempotent: true },
  props: {
    id: Property.ShortText({
      displayName: 'Product',
      description: 'The ID of the product.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { id } = propsValue;

    return await getProduct(+id, auth);
  },
});
