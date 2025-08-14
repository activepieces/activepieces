import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const customApiCall = createAction({
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make custom API calls to Assembled endpoints',
  props: {
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      required: true,
      options: {
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
    }),
    endpoint: Property.ShortText({
      displayName: 'API Endpoint',
      description: 'API endpoint path (e.g., /users, /time-off-requests)',
      required: true,
    }),
    headers: Property.Object({
      displayName: 'Additional Headers',
      required: false,
    }),
    body: Property.Object({
      displayName: 'Request Body',
      required: false,
    }),
  },
  async run(context) {
    const { method, endpoint, headers, body } = context.propsValue;
    
    try {
      const response = await assembledCommon.makeRequest(
        context.auth as string,
        method as HttpMethod,
        endpoint,
        body,
        headers as Record<string, string>
      );

      return {
        success: true,
        status: response.status,
        data: response.body,
      };
    } catch (error) {
      throw new Error(`API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});