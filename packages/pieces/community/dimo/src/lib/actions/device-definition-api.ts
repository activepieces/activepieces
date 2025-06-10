import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const deviceDefinitionApiAction = createAction({
  auth: dimoAuth,
  name: 'device_definition_api',
  displayName: 'Device Definitions API',
  description: 'Utility endpoints for Device Definitions (requires Developer JWT)',
  props: {
    endpoint: Property.ShortText({
      displayName: 'API Endpoint',
      description: 'Device Definition API endpoint path (e.g., /device-definitions/123)',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      description: 'HTTP method for the request',
      required: true,
      defaultValue: 'GET',
      options: {
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
    }),
    body: Property.Object({
      displayName: 'Request Body',
      description: 'Request body for POST/PUT requests',
      required: false,
    }),
  },
  async run(context) {
    const { endpoint, method, body } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for Device Definitions API. Please provide a Developer JWT in the authentication configuration.');
    }

    try {
      const baseUrl = context.auth.baseUrl || 'https://api.dimo.zone';
      const response = await httpClient.sendRequest({
        method: method as HttpMethod,
        url: `${baseUrl}${endpoint}`,
        body,
        headers: {
          'Authorization': `Bearer ${context.auth.developerJwt}`,
          'Content-Type': 'application/json',
        },
      });

      return response.body;
    } catch (error: any) {
      throw new Error(`Device Definitions API request failed: ${error.message}`);
    }
  },
}); 