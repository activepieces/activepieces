import { Property, createAction } from '@activepieces/pieces-framework'
import { vtexAuth } from '../../..'
import { Sku } from '../../common/SKU'

export const getSkuByProductId = createAction({
  auth: vtexAuth,
  name: 'get-sku-by-product-id',
  displayName: 'Get SKU By Product ID',
  description: 'Find a Sku in your catalog by a Product id',
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The Product ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth
    const { productId } = context.propsValue

    const sku = new Sku(hostUrl, appKey, appToken)

    return await sku.getSkuListByProductId(productId)
  },
})
