import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://www.mooninvoice.com/api_mi/public`;

export async function getAccessToken(
  email: string,
  secretKey: string
): Promise<string> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/get_auth_token`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email,
        secret_key: secretKey,
      },
    });

    if (response.body && response.body.data && response.body.data.token) {
      return response.body.data.token;
    } else {
      throw new Error('Failed to obtain access token: ' + JSON.stringify(response.body));
    }
  } catch (error: any) {
    throw new Error(`Failed to get access token: ${error.message || String(error)}`);
  }
}

export async function makeRequest(
  accessToken: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
