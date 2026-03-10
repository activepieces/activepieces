import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { TeableClient } from './common/client';
import { TEABLE_CLOUD_URL } from './common/constants';

export const TeableAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your Teable account using OAuth2 (Teable Cloud only).',
    authUrl: 'https://app.teable.ai/api/oauth/authorize',
    tokenUrl: 'https://app.teable.ai/api/oauth/access_token',
    required: true,
    scope: [
      'base|read',
      'table|read',
      'field|read',
      'record|read',
      'record|create',
      'record|update',
      'record|delete',
    ],
  }),
  PieceAuth.CustomAuth({
    displayName: 'Personal Access Token',
    description: `
Authenticate using a Teable Personal Access Token. Also use this option for self-hosted instances.

To obtain your token:
1. Log in to your Teable account.
2. Click your profile icon (top-right corner).
3. Go to **Settings** > **Personal Access Token**.
4. Click **New Token**, set a name and the required scopes.
5. Copy and save the generated token.
    `,
    required: true,
    props: {
      token: PieceAuth.SecretText({
        displayName: 'Personal Access Token',
        description: 'Your Teable personal access token.',
        required: true,
      }),
      baseUrl: Property.ShortText({
        displayName: 'Base URL',
        description:
          'Teable Cloud: https://app.teable.ai — for self-hosted, enter your own domain.',
        required: false,
      }),
    },
    validate: async ({ auth }) => {
      try {
        const client = new TeableClient(
          auth.token,
          auth.baseUrl || TEABLE_CLOUD_URL
        );
        await client.listBases();
        return { valid: true };
      } catch (e) {
        return {
          valid: false,
          error: e instanceof Error ? e.message : 'Invalid credentials. Check your token and Base URL.',
        };
      }
    },
  }),
];

export type TeableAuthValue = {
  type: AppConnectionType.OAUTH2;
  access_token: string;
} | {
  type: AppConnectionType.CUSTOM_AUTH;
  props: { token: string; baseUrl?: string };
};

export function getTeableToken(auth: TeableAuthValue): string {
  if (auth.type === AppConnectionType.OAUTH2) {
    return auth.access_token;
  }
  return auth.props.token;
}

export function getTeableBaseUrl(auth: TeableAuthValue): string {
  if (auth.type === AppConnectionType.OAUTH2) {
    return TEABLE_CLOUD_URL;
  }
  return auth.props.baseUrl || TEABLE_CLOUD_URL;
}
