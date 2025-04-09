import { Property, createAction } from '@activepieces/pieces-framework'
import { vtexAuth } from '../../..'
import { Brand } from '../../common/Brand'

export const getBrandList = createAction({
  auth: vtexAuth,
  name: 'get-brand-list',
  displayName: 'Get Brand List',
  description: 'Find all Brands in your catalog',
  props: {},
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth

    const brand = new Brand(hostUrl, appKey, appToken)

    return await brand.getBrandList()
  },
})
