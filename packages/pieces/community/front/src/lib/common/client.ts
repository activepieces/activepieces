import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';


const frontApiUrl = 'https://api2.frontapp.com';

/**
 * Makes an authenticated request to the Front API.
 * @param token The user's API token.
 * @param method The HTTP method to use.
 * @param url The API endpoint path (e.g., '/inboxes').
 * @param body The request body for POST/PATCH requests.
 * @returns The response body from the API.
 */
export async function makeRequest<T = Record<string, unknown>>(
  token: string,
  method: HttpMethod,
  url: string,
  body?: object
): Promise<T> {
  const request: HttpRequest = {
    method: method,
    url: `${frontApiUrl}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token,
    },
    body: body,
  };

  const { body: responseBody } = await httpClient.sendRequest<T>(request);
  return responseBody;
}