import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const customApiCallAction = createAction({
  auth: dimoAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description: 'Make custom API calls to any DIMO API endpoint with proper authentication',
  props: {
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      required: true,
      defaultValue: 'GET',
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
    apiDomain: Property.StaticDropdown({
      displayName: 'DIMO API Domain',
      description: 'Select the DIMO API domain for your request',
      required: true,
      options: {
        options: [
          { label: 'Identity API (identity-api.dimo.zone)', value: 'https://identity-api.dimo.zone' },
          { label: 'Telemetry API (telemetry-api.dimo.zone)', value: 'https://telemetry-api.dimo.zone' },
          { label: 'Token Exchange API (token-exchange-api.dimo.zone)', value: 'https://token-exchange-api.dimo.zone' },
          { label: 'Device Definitions API (device-definitions-api.dimo.zone)', value: 'https://device-definitions-api.dimo.zone' },
          { label: 'Attestation API (attestation-api.dimo.zone)', value: 'https://attestation-api.dimo.zone' },
          { label: 'Vehicle Events API (vehicle-events-api.dimo.zone)', value: 'https://vehicle-events-api.dimo.zone' },
          { label: 'Custom URL (specify below)', value: 'custom' },
        ],
      },
    }),
    customUrl: Property.ShortText({
      displayName: 'Custom Base URL',
      description: 'Enter custom base URL when "Custom URL" is selected above',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'API Path',
      description: 'API endpoint path (e.g., /v1/vehicles/123 or /query)',
      required: true,
    }),
    authType: Property.StaticDropdown({
      displayName: 'Authentication Type',
      description: 'Which JWT to use for authentication',
      required: true,
      defaultValue: 'developer',
      options: {
        options: [
          { label: 'Developer JWT (for most APIs)', value: 'developer' },
          { label: 'Vehicle JWT (for vehicle-specific data)', value: 'vehicle' },
        ],
      },
    }),
    vehicleJwt: Property.ShortText({
      displayName: 'Vehicle JWT',
      description: 'Vehicle JWT for vehicle-specific endpoints (required if Auth Type is Vehicle JWT)',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Additional headers to include (optional)',
      required: false,
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      description: 'URL query parameters (optional)',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'Request body for POST/PUT/PATCH requests (JSON format)',
      required: false,
    }),
  },
  
  async run(context) {
    const { method, apiDomain, customUrl, path, authType, vehicleJwt, headers, queryParams, body } = context.propsValue;
    
    // Determine the base URL
    let baseUrl: string;
    if (apiDomain === 'custom') {
      if (!customUrl) {
        throw new Error('Custom URL is required when "Custom URL" is selected');
      }
      baseUrl = customUrl;
    } else {
      baseUrl = apiDomain;
    }
    
    // Determine which JWT to use
    let authToken: string;
    switch (authType) {
      case 'developer':
        if (!context.auth.developerJwt) {
          throw new Error('Developer JWT is required but not configured. Please set it in the connection settings.');
        }
        authToken = context.auth.developerJwt;
        break;
      case 'vehicle':
        if (!vehicleJwt) {
          throw new Error('Vehicle JWT is required but not provided. Please provide a Vehicle JWT from the Token Exchange API.');
        }
        authToken = vehicleJwt;
        break;
      default:
        throw new Error('Invalid authentication type selected');
    }
    
    // Build the full URL
    const fullUrl = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    
    // Build headers
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...headers,
    };
    
    // Build the request
    const request: HttpRequest = {
      method: method as HttpMethod,
      url: fullUrl,
      headers: requestHeaders,
    };
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      const urlObj = new URL(fullUrl);
      Object.entries(queryParams).forEach(([key, value]) => {
        urlObj.searchParams.set(key, String(value));
      });
      request.url = urlObj.toString();
    }
    
    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      request.body = body;
    }
    
    try {
      const response = await httpClient.sendRequest(request);
      
      return {
        status: response.status,
        headers: response.headers,
        body: response.body,
        request: {
          method,
          url: request.url,
          authType,
          tokenUsed: authType === 'vehicle' ? 'Vehicle JWT' : 'Developer JWT',
        },
      };
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        switch (statusCode) {
          case 401:
            throw new Error(`Authentication failed: Invalid or expired JWT. ${authType === 'vehicle' ? 'Your Vehicle JWT may have expired (10 minutes). Use Token Exchange API to get a fresh one.' : 'Your Developer JWT may be invalid. Check console.dimo.org for a fresh JWT.'}`);
          case 403:
            throw new Error(`Permission denied: ${errorBody?.message || 'Insufficient privileges for this request. Check your JWT permissions.'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid request parameters or body format.'}`);
          case 404:
            throw new Error(`Not found: ${errorBody?.message || 'The requested endpoint or resource does not exist.'}`);
          default:
            throw new Error(`API request failed (HTTP ${statusCode}): ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Custom API call failed: ${error.message}`);
    }
  },
}); 