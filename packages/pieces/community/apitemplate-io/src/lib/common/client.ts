import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const APITEMPLATE_REGIONS = {
  default: 'https://rest.apitemplate.io',
  europe: 'https://rest-de.apitemplate.io',
  us: 'https://rest-us.apitemplate.io',
  australia: 'https://rest-au.apitemplate.io',
  'alt-default': 'https://rest-alt.apitemplate.io',
  'alt-europe': 'https://rest-alt-de.apitemplate.io',
  'alt-us': 'https://rest-alt-us.apitemplate.io',
} as const;

export type ApitemplateRegion = keyof typeof APITEMPLATE_REGIONS;

// Interface for authentication object
export interface ApitemplateAuthConfig {
  apiKey: string;
  region: ApitemplateRegion;
}

// Interface for API error response
interface ApitemplateErrorResponse {
  status: string;
  message: string;
}

export const BASE_URL = APITEMPLATE_REGIONS.default;

export function getRegionalBaseUrl(region?: ApitemplateRegion): string {
  return APITEMPLATE_REGIONS[region || 'default'];
}

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string> | string,
  region?: ApitemplateRegion
) {
  try {
    let mergedHeaders: Record<string, string> = {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    };

    // Handle custom headers parameter
    if (typeof headers === 'string') {
      mergedHeaders['Content-Type'] = headers;
    } else if (typeof headers === 'object' && headers !== null) {
      mergedHeaders = {
        ...mergedHeaders,
        ...headers,
      };
    }

    const baseUrl = getRegionalBaseUrl(region);
    const response = await httpClient.sendRequest({
      method,
      url: `${baseUrl}${path}`,
      headers: mergedHeaders,
      body,
    });

    return response.body;
  } catch (error: any) {
    // Handle APITemplate.io specific error format
    if (error.response?.body) {
      const errorBody = error.response.body as ApitemplateErrorResponse;
      if (errorBody.status === 'error' && errorBody.message) {
        throw new Error(`APITemplate.io Error: ${errorBody.message}`);
      }
    }

    // Handle HTTP status errors
    if (error.response?.status) {
      const statusCode = error.response.status;
      switch (statusCode) {
        case 401:
          throw new Error('APITemplate.io Error: Invalid API key or unauthorized access');
        case 403:
          throw new Error('APITemplate.io Error: Access forbidden - check your API permissions');
        case 404:
          throw new Error('APITemplate.io Error: Resource not found - check your template ID');
        case 429:
          throw new Error('APITemplate.io Error: Rate limit exceeded - please try again later');
        case 500:
          throw new Error('APITemplate.io Error: Internal server error - please try again later');
        default:
          throw new Error(`APITemplate.io Error: HTTP ${statusCode} - ${error.message || 'Unknown error'}`);
      }
    }

    // Generic error fallback
    throw new Error(`APITemplate.io API Error: ${error.message || String(error)}`);
  }
}