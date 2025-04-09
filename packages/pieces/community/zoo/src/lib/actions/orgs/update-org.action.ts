import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const updateOrgAction = createAction({
  name: 'update_org',
  displayName: 'Update Organization',
  description: 'Update your organization details',
  auth: zooAuth,
  // category: 'Organizations',
  props: {
    name: Property.ShortText({
      displayName: 'Organization Name',
      required: true,
      description: 'The new name for your organization',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/org',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        name: propsValue.name,
      },
    })
    return response.body
  },
})
