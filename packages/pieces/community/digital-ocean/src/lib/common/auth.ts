import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { digitalOceanApiCall } from './client';
import { AppConnectionType } from '@activepieces/pieces-framework';

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
    getConnectionIdentifier: async ({ auth }) => {
      const info: DigitalOceanTokenInfo | undefined = auth.data['info'];
      const fromToken = info?.email || info?.name || info?.team_name;
      if (fromToken) {
        return fromToken;
      }
      return fetchAccountLabel(auth.access_token);
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
    getConnectionIdentifier: async ({ auth }) => fetchAccountLabel(auth),
  }),
];

export type DigitalOceanAuthValue = AppConnectionValueForAuthProperty<
  typeof digitalOceanAuth
>;

async function fetchAccountLabel(
  token: string
): Promise<string | undefined> {
  try {
    const response = await httpClient.sendRequest<{
      account?: DigitalOceanAccount;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.digitalocean.com/v2/account',
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    const account = response.body.account;
    return account?.email || account?.name || account?.team?.name || undefined;
  } catch {
    return undefined;
  }
}

type DigitalOceanTokenInfo = {
  email?: string;
  name?: string;
  team_name?: string;
};

type DigitalOceanAccount = {
  email?: string;
  name?: string;
  team?: { name?: string };
};
