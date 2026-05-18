import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = `https://panel.letscalendar.com/api/lc`;

export async function getAccessToken(
  client_key: string,
  secret_key: string
): Promise<string> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/access_token`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        client_key: client_key,
        secret_key: secret_key,
      },
    });

    if (
      response.body &&
      response.body.data &&
      response.body.data.access_token
    ) {
      return response.body.data.access_token;
    } else {
      throw new Error(
        'Failed to obtain access token: ' + JSON.stringify(response.body)
      );
    }
  } catch (error: any) {
    throw new Error(
      `Failed to get access token: ${error.message || String(error)}`
    );
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
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error: any) {
    throw new Error(`Unexpected error: ${error.message || String(error)}`);
  }
}
