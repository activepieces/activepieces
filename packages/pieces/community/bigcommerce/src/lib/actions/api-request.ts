import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const apiRequestAction = createAction({
  auth: bigcommerceAuth,
  name: 'api_request',
  displayName: 'API Request (Beta)',
  description: 'Makes a raw HTTP request to BigCommerce API',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      options: {
        options: [
          { label: 'GET', value: HttpMethod.GET },
          { label: 'POST', value: HttpMethod.POST },
          { label: 'PUT', value: HttpMethod.PUT },
          { label: 'DELETE', value: HttpMethod.DELETE },
          { label: 'PATCH', value: HttpMethod.PATCH },
        ],
      },
    }),
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      description: 'API endpoint (e.g., /v3/customers)',
      required: true,
    }),
    body: Property.Json({
      displayName: 'Body',
      description: 'Request body (for POST/PUT/PATCH)',
      required: false,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      context.propsValue.endpoint,
      context.propsValue.method as HttpMethod,
      context.propsValue.body
    );
    return response.body;
  },
});
