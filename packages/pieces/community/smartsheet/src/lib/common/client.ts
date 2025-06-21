import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export type SmartsheetApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  region?: 'default' | 'gov' | 'eu' | 'au';
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export function getBaseUrl(region: SmartsheetApiCallParams['region'] = 'default'): string {
  switch (region) {
    case 'gov':
      return 'https://api.smartsheetgov.com/2.0';
    case 'eu':
      return 'https://api.smartsheet.eu/2.0';
    case 'au':
      return 'https://api.smartsheet.au/2.0';
    case 'default':
    default:
      return 'https://api.smartsheet.com/2.0';
  }
}

export async function smartsheetApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  region = 'default',
  query,
  body,
}: SmartsheetApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: getBaseUrl(region) + resourceUri,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
