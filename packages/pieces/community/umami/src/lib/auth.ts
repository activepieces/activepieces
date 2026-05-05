import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';

const selfHostedAuth = PieceAuth.CustomAuth({
  displayName: 'Self-hosted (Username & Password)',
  description:
    'Connect to your own Umami instance using the same credentials you use to log in to your dashboard.',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      description:
        'Base URL of your Umami instance (e.g. `https://umami.example.com`). Do not include a trailing slash.',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your Umami login username.',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Umami login password.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.baseUrl.replace(/\/+$/, '');
      await httpClient.sendRequest<{ token: string }>({
        method: HttpMethod.POST,
        url: `${baseUrl}/api/auth/login`,
        body: { username: auth.username, password: auth.password },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Connection failed. Check that the URL is reachable and your username/password are correct.',
      };
    }
  },
});

const cloudAuth = PieceAuth.SecretText({
  displayName: 'Umami Cloud (API Key)',
  description:
    'Connect to Umami Cloud using an API key. Create one in **Settings → API Keys**.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.umami.is/v1/websites',
        headers: { 'x-umami-api-key': auth },
        queryParams: { pageSize: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Check your key in Umami Cloud → Settings → API Keys.',
      };
    }
  },
});

export const umamiAuth = [selfHostedAuth, cloudAuth];

export type UmamiAuthValue = AppConnectionValueForAuthProperty<
  typeof umamiAuth
>;



export function getBaseUrl(auth: UmamiAuthValue): string {

  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return 'https://api.umami.is/v1';
  }
  return auth.props.baseUrl.replace(/\/+$/, '') + '/api';
}

export async function getAuthHeaders(
  auth: UmamiAuthValue,
): Promise<Record<string, string>> {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return { 'x-umami-api-key': auth.secret_text };
  }
  const baseUrl = auth.props.baseUrl.replace(/\/+$/, '');
  const loginResponse = await httpClient.sendRequest<{ token: string }>({
    method: HttpMethod.POST,
    url: `${baseUrl}/api/auth/login`,
    body: { username: auth.props.username, password: auth.props.password },
  });
  return { Authorization: `Bearer ${loginResponse.body.token}` };
}
