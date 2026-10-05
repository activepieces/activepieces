import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://api.cryptolens.io/api`;

export async function makeRequest(
  access_token: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const [pathname, search] = path.split('?');
    const authenticatedUrl = `${BASE_URL}${pathname}?token=${encodeURIComponent(
      access_token
    )}`;
    const sendsFormBody = method !== HttpMethod.GET && !!search;

    const response = await httpClient.sendRequest({
      method,
      url: sendsFormBody || !search
        ? authenticatedUrl
        : `${authenticatedUrl}&${search}`,
      headers: {
        'Content-Type': sendsFormBody
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
      },
      body: sendsFormBody ? search : body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
