import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';
import { umamiApiCall } from './common';

export function getBaseUrl(auth: AppConnectionValueForAuthProperty<typeof umamiAuth>): string {
  if (auth.props.authMode === 'cloud') {
    return 'https://api.umami.is/v1';
  }
  return (auth.props.baseUrl ?? '').replace(/\/+$/, '') + '/api';
}

export async function getAuthHeaders(auth: AppConnectionValueForAuthProperty<typeof umamiAuth>): Promise<Record<string, string>> {
  if (auth.props.authMode === 'cloud') {
    return { 'x-umami-api-key': auth.props.apiKey ?? '' };
  }
  const loginResponse = await httpClient.sendRequest<{ token: string }>({
    method: HttpMethod.POST,
    url: `${getBaseUrl(auth)}/auth/login`,
    body: { username: auth.props.username, password: auth.props.password },
  });
  return { Authorization: `Bearer ${loginResponse.body.token}` };
}

export const umamiAuth = PieceAuth.CustomAuth({
  displayName: '',
  description: 'Choose **Self-hosted** to log in with a username and password, or **Umami Cloud** to authenticate with an API key from **Settings → API Keys**.',
  required: true,
  props: {
    authMode: Property.StaticDropdown({
      displayName: 'Login Method',
      description: 'How you log in to Umami.',
      required: true,
      defaultValue: 'self_hosted',
      options: {
        options: [
          { label: 'Self-hosted — Username & Password', value: 'self_hosted' },
          { label: 'Umami Cloud — API Key', value: 'cloud' },
        ],
      },
    }),
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Base URL of your self-hosted Umami instance (e.g. `https://umami.example.com`). Not required for Umami Cloud.',
      required: false,
    }),

    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your Umami login username. Required for self-hosted.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Umami login password. Required for self-hosted.',
      required: false,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Umami Cloud API key. Found in Settings → API Keys.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await umamiApiCall({
        method: HttpMethod.GET,
        path: '/me',
        auth: { props: auth, type: AppConnectionType.CUSTOM_AUTH }
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid connection. Check your server URL and credentials.' };
    }
  },
});

