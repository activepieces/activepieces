import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const getUserAction = createAction({
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieve your user information',
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    })
    return response.body
  },
})
