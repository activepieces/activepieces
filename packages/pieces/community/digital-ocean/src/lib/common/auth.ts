import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { digitalOceanApiCall } from './client';
import { AppConnectionType } from '@activepieces/shared';

export const digitalOceanAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your DigitalOcean account using OAuth2.',
    authUrl: 'https://cloud.digitalocean.com/v1/oauth/authorize',
    tokenUrl: 'https://cloud.digitalocean.com/v1/oauth/token',
    required: true,
    scope: [],
    validate: async ({ auth }) => {
      try {
        await digitalOceanApiCall({
          method: HttpMethod.GET,
          path: '/account',
          auth: {
            type: AppConnectionType.OAUTH2,
            access_token: auth.access_token,
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    },
  }),
  PieceAuth.SecretText({
    displayName: 'Personal Access Token',
    required: true,
    description:
      'Generate a Personal Access Token from DigitalOcean Control Panel under API > Personal access tokens.',
    validate: async ({ auth }) => {
      try {
        await digitalOceanApiCall({
          method: HttpMethod.GET,
          path: '/account',
          auth: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: auth,
          },
        });
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: (e as Error).message,
        };
      }
    },
  }),
];

export type DigitalOceanAuthValue = AppConnectionValueForAuthProperty<
  typeof digitalOceanAuth
>;
