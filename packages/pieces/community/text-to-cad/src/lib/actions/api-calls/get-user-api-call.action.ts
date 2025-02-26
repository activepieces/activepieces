import { createAction, Property } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserApiCallAction = createAction({
  name: 'get_user_api_call',
  displayName: 'Get User API Call',
  description: 'Retrieve details of a specific API call made by your user account',
  auth: textToCadAuth,
  category: 'API Calls',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      required: true,
      description: 'The ID of the API call to retrieve',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.zoo.dev/user/api-calls/${propsValue.callId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
