import { createAction, Property } from '@activepieces/pieces-framework';
import { Product } from '../../common/Product';
import { vtexAuth } from '../../..';

export const getProductById = createAction({
  auth: vtexAuth,
  name: 'get-product-by-id',
  displayName: 'Get Product By ID',
  description: "Find a product in your catalog by it's id",
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve a single catalog product from a VTEX store by its numeric product ID. Use to look up product details when you already know the product ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The product ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;
    const { productId } = context.propsValue;

    const product = new Product(hostUrl, appKey, appToken);

    return await product.getProductById(productId);
  },
});
