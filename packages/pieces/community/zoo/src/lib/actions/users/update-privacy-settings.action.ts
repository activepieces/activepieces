import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { zooAuth } from '../../../index'

export const updatePrivacySettingsAction = createAction({
  name: 'update_privacy_settings',
  displayName: 'Update Privacy Settings',
  description: 'Update your user privacy settings',
  auth: zooAuth,
  // category: 'Users',
  props: {
    settings: Property.Object({
      displayName: 'Privacy Settings',
      required: true,
      description: 'The new privacy settings to apply',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: 'https://api.zoo.dev/user/privacy',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: propsValue.settings,
    })
    return response.body
  },
})
