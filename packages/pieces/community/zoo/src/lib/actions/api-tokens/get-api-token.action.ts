import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getApiTokenAction = createAction({
  name: 'get_api_token',
  displayName: 'Get API Token',
  description: 'Retrieve details of a specific API token',
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'The token to retrieve details for',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/user/api-tokens/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
