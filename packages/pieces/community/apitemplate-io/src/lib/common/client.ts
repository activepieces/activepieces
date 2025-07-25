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

export const BASE_URL = APITEMPLATE_REGIONS.default;

export function getRegionalBaseUrl(region?: ApitemplateRegion): string {
  return APITEMPLATE_REGIONS[region || 'default'];
}

export async function makeRequest(
  api_key: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string> | string,
  region?: ApitemplateRegion
) {
  try {
    let mergedHeaders: Record<string, string> = {
      'X-API-KEY': api_key,
      'Content-Type': 'application/json',
    };

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
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
