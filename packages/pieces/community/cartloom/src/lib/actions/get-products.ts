import { createAction } from '@activepieces/pieces-framework';
import { getProducts } from '../api';
import { cartloomAuth } from '../auth';

export const getProductsAction = createAction({
  name: 'get_products',
  auth: cartloomAuth,
  displayName: 'Get Products',
  description: 'Get a list of products from Cartloom',
  props: {},
  async run(context) {
    return await getProducts(context.auth);
  },
});
