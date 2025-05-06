import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const medullarCommon = {
  baseUrl: 'https://api.medullar.dev',
  authUrl: 'https://api.medullar.dev/auth/v1',
  exploratorUrl: 'https://api.medullar.dev/explorator/v1',
};

export async function getUser(authentication: string) {
  const userResponse = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${medullarCommon.authUrl}/users/me/`,
    headers: {
      Authorization: `Bearer ${authentication}`,
    },
  });

  return userResponse.body;
}

