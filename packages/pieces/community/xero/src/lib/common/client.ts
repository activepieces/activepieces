import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.xero.com/api.xro/2.0`;

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string> | string
) {
  try {
    let mergedHeaders: Record<string, string> = {
      Authorization: `Bearer ${access_token}`,
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

    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: mergedHeaders,
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
