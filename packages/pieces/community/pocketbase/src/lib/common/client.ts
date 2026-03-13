import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export function normalizeHost(host: string): string {
  return host.replace(/\/+$/, '');
}

export async function pocketbaseAuthenticate(host: string, email: string, password: string): Promise<string> {
  const normalizedHost = normalizeHost(host);
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${normalizedHost}/api/collections/_superusers/auth-with-password`,
    body: {
      identity: email,
      password: password,
    },
  });

  const token = response.body?.token;
  if (!token) {
    throw new Error('Authentication failed: no token returned from PocketBase.');
  }

  return token;
}
