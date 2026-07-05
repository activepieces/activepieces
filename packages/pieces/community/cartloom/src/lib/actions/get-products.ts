import { createAction } from '@activepieces/pieces-framework';
import { getProducts } from '../api';
import { cartloomAuth } from '../auth';

export const getProductsAction = createAction({
  name: 'get_products',
  auth: cartloomAuth,
  displayName: 'Get Products',
  description: 'Get a list of products from Cartloom',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full list of products from the connected Cartloom store. Use to discover available products and their IDs (for example before creating a discount targeting specific products). Takes no input and returns all products; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    return await getProducts(context.auth.props);
  },
});
