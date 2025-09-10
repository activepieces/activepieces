import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smarterProctoringAuth } from '../..';

export const customApiCallAction = createAction({
  name: 'custom_api_call',
  auth: smarterProctoringAuth,
  displayName: 'Custom API Call',
  description: 'Make a custom API call to SmarterProctoring',
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
      required: true,
      description: 'The API endpoint path (e.g., /api/v1/exams)',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: false,
      description: 'Additional headers to include in the request',
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      required: false,
      description: 'Query parameters to include in the request',
    }),
    body: Property.Object({
      displayName: 'Body',
      required: false,
      description: 'The request body (for POST, PUT, PATCH requests)',
    }),
  },
  async run(context) {
    const { method, endpoint, headers, queryParams, body } = context.propsValue;
    const { apiKey, baseUrl } = context.auth;

    const convertedQueryParams: Record<string, string> = {};
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        convertedQueryParams[key] = String(value);
      });
    }

    const request: HttpRequest = {
      method: method,
      url: `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
      headers: {
        'token': apiKey,
        'Content-Type': 'application/json',
        ...headers,
      },
      queryParams: convertedQueryParams,
      body: body,
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      } else if (error.response?.status === 404) {
        throw new Error(`API endpoint not found: ${endpoint}`);
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status >= 500) {
        throw new Error(`SmarterProctoring server error: ${error.response?.body?.message || error.message}`);
      }
      throw new Error(`Failed to make API call to SmarterProctoring: ${error.message || 'Unknown error'}`);
    }
  },
});
