import { Property, createAction } from '@activepieces/pieces-framework'
import { vtexAuth } from '../../..'
import { Brand } from '../../common/Brand'

export const deleteBrand = createAction({
  auth: vtexAuth,
  name: 'delete-brand',
  displayName: 'Delete Brand',
  description: "Delete a Brand in your catalog by it's id",
  props: {
    brandId: Property.Number({
      displayName: 'Brand ID',
      description: 'The Brand ID',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth
    const { brandId } = context.propsValue

    const brand = new Brand(hostUrl, appKey, appToken)

    return await brand.deleteBrand(brandId)
  },
})
