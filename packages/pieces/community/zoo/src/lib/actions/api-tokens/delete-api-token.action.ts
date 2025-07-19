import { createAction, Property } from '@ensemble/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@ensemble/pieces-common';

export const deleteApiTokenAction = createAction({
  name: 'delete_api_token',
  displayName: 'Delete API Token',
  description: 'Delete an API token from your user account',
  auth: zooAuth,
  // category: 'API Tokens',
  props: {
    token: Property.ShortText({
      displayName: 'Token',
      required: true,
      description: 'The token to delete',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.zoo.dev/user/api-tokens/${propsValue.token}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
