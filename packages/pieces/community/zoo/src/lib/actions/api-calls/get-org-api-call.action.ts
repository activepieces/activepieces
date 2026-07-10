import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOrgApiCallAction = createAction({
  name: 'get_org_api_call',
  displayName: 'Get Organization API Call',
  description: 'Retrieve details of a specific API call made by your organization',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single API call billed to the authenticated organization by its call ID, including status, cost, and timing. Use the org scope here; for a call tied to your own user use get-user-api-call, and to browse without an ID use list-org-api-calls. Read-only lookup with no side effects.', idempotent: true },
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
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
