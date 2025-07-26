import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { apitemplateAuth } from '../common/auth';
import { APITemplateClient } from '../common/client';

export const customApiCall = createAction({
  auth: apitemplateAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom API call to APITemplate.io',
  props: {
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      description: 'The HTTP method to use',
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
      defaultValue: HttpMethod.GET,
    }),
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      description: 'The API endpoint (e.g., /list-templates)',
      required: true,
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'The request body (for POST, PUT, PATCH requests)',
      required: false,
      defaultValue: {},
    }),
    query_params: Property.Json({
      displayName: 'Query Parameters',
      description: 'Query parameters to append to the URL',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { method, endpoint, body, query_params } = context.propsValue;
    const client = new APITemplateClient(context.auth.apiKey);
    
    try {
      const queryParams: any = {};
      if (query_params && typeof query_params === 'object') {
        Object.keys(query_params).forEach(key => {
          const value = query_params[key];
          if (value !== undefined && value !== null) {
            queryParams[key] = String(value);
          }
        });
      }
      
      const result = await client.makeRequest(
        method as HttpMethod,
        endpoint,
        body,
        queryParams
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new Error(`Custom API call failed: ${error}`);
    }
  },
});