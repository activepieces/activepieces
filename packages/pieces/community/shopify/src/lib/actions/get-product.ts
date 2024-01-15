import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProduct } from '../common';

export const getProductAction = createAction({
  auth: shopifyAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: `Get existing product.`,
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
