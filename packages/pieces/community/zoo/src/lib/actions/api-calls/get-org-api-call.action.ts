import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgApiCallAction = createAction({
  name: 'get_org_api_call',
  displayName: 'Get Organization API Call',
  description: 'Retrieve details of a specific API call made by your organization',
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
      url: `https://api.zoo.dev/org/api-calls/${propsValue.callId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
