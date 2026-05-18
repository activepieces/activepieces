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


export const BASE_URL = APITEMPLATE_REGIONS.default;

export function getRegionalBaseUrl(region?: ApitemplateRegion): string {
  return APITEMPLATE_REGIONS[region || 'default'];
}

// Helper function to get alternative regions for fallback
function getAlternativeRegions(
  currentRegion?: ApitemplateRegion
): ApitemplateRegion[] {
  const alternatives: ApitemplateRegion[] = [];

  switch (currentRegion) {
    case 'default':
      alternatives.push('alt-default', 'us', 'australia', 'europe');
      break;
    case 'europe':
      alternatives.push('alt-europe', 'default', 'us', 'australia');
      break;
    case 'us':
      alternatives.push('alt-us', 'default', 'australia', 'europe');
      break;
    case 'australia':
      alternatives.push('default', 'us', 'europe');
      break;
    case 'alt-default':
      alternatives.push('default', 'us', 'australia');
      break;
    case 'alt-europe':
      alternatives.push('europe', 'default', 'us');
      break;
    case 'alt-us':
      alternatives.push('us', 'default', 'australia');
      break;
    default:
      alternatives.push('default', 'us', 'australia', 'europe');
  }

  return alternatives;
}

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string> | string,
  region?: ApitemplateRegion
) {
  const baseUrl = getRegionalBaseUrl(region);

  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${baseUrl}/v2${path}`,
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  } catch (error: any) {
    // Handle APITemplate.io specific error format
    // if (error.response?.body && typeof error.response.body === 'object') {
    //   const errorBody = error.response.body as ApitemplateErrorResponse;
    //   if (errorBody.status === 'error' && errorBody.message) {
    //     throw new Error(`APITemplate.io Error: ${errorBody.message}`);
    //   }
    // }

    // Handle HTTP status errors
    if (error.response?.status) {
      const statusCode = error.response.status;
      const regionInfo = region ? ` (${region} region)` : '';

      switch (statusCode) {
        case 401:
          throw new Error(
            'APITemplate.io Error: Invalid API key or unauthorized access'
          );
        case 403:
          throw new Error(
            'APITemplate.io Error: Access forbidden - check your API permissions'
          );
        case 404:
          throw new Error(
            'APITemplate.io Error: Resource not found - check your template ID'
          );
        case 429:
          throw new Error(
            'APITemplate.io Error: Rate limit exceeded - please try again later'
          );
        case 500:
          throw new Error(
            `APITemplate.io Error: Internal server error - please try again later${regionInfo}`
          );
        case 502:
        case 503:
        case 504:
          {

          const alternatives = getAlternativeRegions(region);
          const suggestionText =
            alternatives.length > 0
              ? `\n\nSuggested alternatives: Try switching to one of these regions: ${alternatives
                  .slice(0, 3)
                  .join(', ')}`
              : '';

          throw new Error(
            `APITemplate.io Error: Service unavailable${regionInfo}. ` +
              `The ${
                region || 'default'
              } region server is temporarily down.${suggestionText}`
          );}
        default:
          throw new Error(
            `APITemplate.io Error: HTTP ${statusCode}${regionInfo} - ${
              error.message || 'Unknown error'
            }`
          );
      }
    }

    // Handle network or other errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      const alternatives = getAlternativeRegions(region);
      const suggestionText =
        alternatives.length > 0
          ? `\n\nSuggested alternatives: Try switching to one of these regions: ${alternatives
              .slice(0, 3)
              .join(', ')}`
          : '';

      throw new Error(
        `APITemplate.io Error: Network connectivity issue with ${
          region || 'default'
        } region.${suggestionText}`
      );
    }
  }
}
