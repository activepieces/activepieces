import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const getServiceAccountAction = createAction({
  name: 'get_service_account',
  displayName: 'Get Service Account',
  description: 'Retrieve details of a specific service account',
  auth: zooAuth,
  // category: 'Service Accounts',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'Token of the service account to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/org/service-accounts/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    })
    return response.body
  },
})
