import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mycaseAuth } from '../../index';

export const makeRequest = createAction({
  auth: mycaseAuth,
  name: 'make_request',
  displayName: 'API Request',
  description: 'Makes a raw HTTP request to the MyCase API',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'HTTP method to use',
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
      defaultValue: 'GET',
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'API endpoint path (e.g., /cases or /clients/123)',
      required: true,
    }),
    query_params: Property.Object({
      displayName: 'Query Parameters',
      description: 'Query parameters as JSON object',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'Request body as JSON (for POST, PUT, PATCH)',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Additional Headers',
      description: 'Additional headers as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const baseUrl = 'https://external-integrations.mycase.com/v1';
    const path = context.propsValue.path.startsWith('/') 
      ? context.propsValue.path 
      : `/${context.propsValue.path}`;
    
    const url = `${baseUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.auth.access_token}`,
      ...((context.propsValue.headers as Record<string, string>) || {}),
    };

    try {
      const response = await httpClient.sendRequest({
        method: context.propsValue.method as HttpMethod,
        url,
        headers,
        queryParams: context.propsValue.query_params as Record<string, string>,
        body: context.propsValue.body,
      });

      return {
        success: true,
        status: response.status,
        headers: response.headers,
        body: response.body,
      };
    } catch (error: any) {
      return {
        success: false,
        status: error.response?.status,
        error: error.message || 'Request failed',
        details: error.response?.body || error,
      };
    }
  },
});
