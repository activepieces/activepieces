import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getUserApiCallAction = createAction({
  name: 'get_user_api_call',
  displayName: 'Get User API Call',
  description: 'Retrieve details of a specific API call made by your user account',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single API call from the authenticated user\'s history by its call ID, including status, cost, and timing. Use the user scope here; for a call billed to the organization use get-org-api-call, and to browse without an ID use list-user-api-calls. Read-only lookup with no side effects.', idempotent: true },
  auth: zooAuth,
  // category: 'API Calls',
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
