import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'

import { wooAuth } from '../..'

export const wooFindProduct = createAction({
  name: 'Find Product',
  displayName: 'Find Product',
  description: 'Find a Product',
  auth: wooAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Product ID',
      description: 'Enter the product ID',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '')
    const productId = configValue.propsValue['id']

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/products/${productId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.consumerKey,
        password: configValue.auth.consumerSecret,
      },
    }

    const res = await httpClient.sendRequest(request)

    return res.body
  },
})
