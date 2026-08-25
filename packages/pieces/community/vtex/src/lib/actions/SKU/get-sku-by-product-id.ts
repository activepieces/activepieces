import { createAction, Property } from '@activepieces/pieces-framework';
import { Sku } from '../../common/SKU';
import { vtexAuth } from '../../..';

export const getSkuByProductId = createAction({
  auth: vtexAuth,
  name: 'get-sku-by-product-id',
  displayName: 'Get SKU By Product ID',
  description: 'Find a Sku in your catalog by a Product id',
  audience: 'both',
  aiMetadata: {
    description:
      'List the SKUs (product variations) associated with a given product in a VTEX store catalog, identified by the numeric product ID. Use to enumerate a product\'s variants. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The Product ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth.props;
    const { productId } = context.propsValue;

    const sku = new Sku(hostUrl, appKey, appToken);

    return await sku.getSkuListByProductId(productId);
  },
});
