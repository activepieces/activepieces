import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.clockify.me/api/v1';

interface ClockifyHeaders {
  [key: string]: string;
}

export async function makeRequest(auth: string, method: HttpMethod, path: string, body?: unknown) {
  // For subdomain workspaces, we need to use the provided API key as is
  // The auth token can be either X-Api-Key or X-Addon-Token based on how the user obtained it

  // We'll use X-Api-Key by default which works in most cases
  let headers: ClockifyHeaders = {
    'X-Api-Key': `${auth}`,
    'Content-Type': 'application/json',
  };

  // If the auth token starts with a specific prefix that indicates it's an addon token
  // we could switch to using X-Addon-Token instead
  // This is a placeholder logic - Clockify docs don't specify a clear way to distinguish these
  if (auth.startsWith('addon_')) {
    headers = {
      'X-Addon-Token': `${auth}`,
      'Content-Type': 'application/json',
    };
  }

  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers,
    body,
  });

  return response.body;
}
