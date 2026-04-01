import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

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
      const loginResponse = await httpClient.sendRequest<{ token: string }>({
        method: HttpMethod.POST,
        url: `${baseUrl}/api/auth/login`,
        body: { username: auth.username, password: auth.password },
      });
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/api/me`,
        headers: {
          Authorization: `Bearer ${loginResponse.body.token}`,
        },
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

const cloudAuth = PieceAuth.CustomAuth({
  displayName: 'Umami Cloud (API Key)',
  description:
    'Connect to Umami Cloud using an API key. Create one in **Settings → API Keys**.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Umami Cloud API key from Settings → API Keys.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.umami.is/v1/websites',
        headers: { 'x-umami-api-key': auth.apiKey },
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

type SelfHostedProps = { baseUrl: string; username: string; password: string };
type CloudProps = { apiKey: string };
type AuthProps = SelfHostedProps | CloudProps;

export function isCloud(props: AuthProps): props is CloudProps {
  return 'apiKey' in props;
}

export function getProps(auth: UmamiAuthValue): AuthProps {
  return (auth as { props: AuthProps }).props;
}

export function getBaseUrl(auth: UmamiAuthValue): string {
  const props = getProps(auth);
  if (isCloud(props)) {
    return 'https://api.umami.is/v1';
  }
  return props.baseUrl.replace(/\/+$/, '') + '/api';
}

export async function getAuthHeaders(
  auth: UmamiAuthValue,
): Promise<Record<string, string>> {
  const props = getProps(auth);
  if (isCloud(props)) {
    return { 'x-umami-api-key': props.apiKey };
  }
  const baseUrl = props.baseUrl.replace(/\/+$/, '');
  const loginResponse = await httpClient.sendRequest<{ token: string }>({
    method: HttpMethod.POST,
    url: `${baseUrl}/api/auth/login`,
    body: { username: props.username, password: props.password },
  });
  return { Authorization: `Bearer ${loginResponse.body.token}` };
}
