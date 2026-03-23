import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type OmniHrAuth = {
  props: {
    username: string;
    password: string;
    origin: string;
  };
};

export async function getAccessToken(auth: OmniHrAuth): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: auth.props.origin,
  };

  const tokenResponse = await httpClient.sendRequest<{
    access: string;
    refresh: string;
  }>({
    method: HttpMethod.POST,
    url: 'https://api.omnihr.co/api/v1/auth/token/',
    headers,
    body: {
      username: auth.props.username,
      password: auth.props.password,
    },
  });

  return tokenResponse.body.access;
}

export async function getAuthHeaders(
  auth: OmniHrAuth
): Promise<Record<string, string>> {
  const accessToken = await getAccessToken(auth);

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Origin: auth.props.origin,
  };
}
