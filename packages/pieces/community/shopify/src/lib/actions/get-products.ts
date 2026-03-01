import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getProducts } from '../common';

export const getProductsAction = createAction({
  auth: shopifyAuth,
  name: 'get_products',
  displayName: 'Get Products',
  description: `Get existing products by title.`,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { title } = propsValue;

    return await getProducts(auth, {
      title,
    });
  },
});
