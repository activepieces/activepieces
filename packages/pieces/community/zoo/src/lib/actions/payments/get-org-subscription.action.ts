import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const getOrgSubscriptionAction = createAction({
  name: 'get_org_subscription',
  displayName: 'Get Organization Subscription',
  description: 'Retrieve the current subscription for your organization',
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org/payment/subscriptions',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    })
    return response.body
  },
})
