import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const getUserPaymentAction = createAction({
  name: 'get_user_payment',
  displayName: 'Get User Payment Info',
  description: 'Retrieve payment information for your user account',
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    })
    return response.body
  },
})
