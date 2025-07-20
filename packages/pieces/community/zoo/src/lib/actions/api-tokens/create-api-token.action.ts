import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createApiTokenAction = createAction({
  name: 'create_api_token',
  displayName: 'Create API Token',
  description: 'Create a new API token for your user account',
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    name: Property.ShortText({
      displayName: 'Token Name',
      required: true,
      description: 'A name to identify this token',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.zoo.dev/user/api-tokens',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        name: propsValue.name,
      },
    });
    return response.body;
  },
});
