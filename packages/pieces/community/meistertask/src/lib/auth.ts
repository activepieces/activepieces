import { AppConnectionValueForAuthProperty, AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEISTERTASK_API_URL } from './common/common';

export const meistertaskAuth = [
  PieceAuth.OAuth2({
    description: 'Authentication for MeisterTask using OAuth2 (uses MindMeister / MeisterTask OAuth2)',
    authUrl: 'https://www.mindmeister.com/oauth2/authorize',
    tokenUrl: 'https://www.mindmeister.com/oauth2/token',
    required: true,
    scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
    validate: async ({ auth }) => {
      const accessToken = auth.access_token;
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        });
        return {
          valid: true,
        };
      } catch (e) {
        return {
          valid: false,
          error: 'Invalid token or insufficient scopes.',
        };
      }
    },
  }),
  PieceAuth.CustomAuth({
    displayName: 'API Token',
    description: 'Authenticate using a MeisterTask Personal Access Token / API Token.',
    required: true,
    props: {
      token: PieceAuth.SecretText({
        displayName: 'API Token',
        description: 'Your MeisterTask Personal Access Token or API Token.',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${MEISTERTASK_API_URL}/projects`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.token,
          },
        });
        return {
          valid: true,
        };
      } catch (e) {
        return {
          valid: false,
          error: 'Invalid API token.',
        };
      }
    },
  }),
];

export type MeisterTaskAuthValue = AppConnectionValueForAuthProperty<typeof meistertaskAuth>;

export function getAccessToken(auth: unknown): string {
  if (!auth) return '';
  if (typeof auth === 'string') return auth;
  const authObj = auth as Record<string, unknown>;
  if (authObj['type'] === AppConnectionType.CUSTOM_AUTH && (authObj['props'] as Record<string, string>)?.['token']) {
    return (authObj['props'] as Record<string, string>)['token'];
  }
  if (authObj['type'] === AppConnectionType.OAUTH2 && typeof authObj['access_token'] === 'string') {
    return authObj['access_token'];
  }
  if (typeof authObj['access_token'] === 'string') {
    return authObj['access_token'];
  }
  if ((authObj['props'] as Record<string, string>)?.['token']) {
    return (authObj['props'] as Record<string, string>)['token'];
  }
  if (typeof authObj['token'] === 'string') {
    return authObj['token'];
  }
  return '';
}
