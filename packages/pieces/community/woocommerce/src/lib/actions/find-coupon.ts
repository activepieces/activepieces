import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'

import { wooAuth } from '../..'

export const wooFindCoupon = createAction({
  name: 'Find Coupon',
  displayName: 'Find Coupon',
  description: 'Find a Coupon',
  auth: wooAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'Enter the coupon ID',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '')
    const couponId = configValue.propsValue['id']

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/coupons/${couponId}`,
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
