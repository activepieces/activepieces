import { PieceAuth } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';

import { validateGetResponseAuth } from './client';

export const getresponseAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your GetResponse account using OAuth2.',
    authUrl: 'https://app.getresponse.com/oauth2_authorize.html',
    tokenUrl: 'https://api.getresponse.com/v3/token',
    required: true,
    scope: [],
  }),
  PieceAuth.CustomAuth({
    displayName: 'API Key',
    description: `Authenticate using a GetResponse API key.

To get your API key:
1. Sign in to your GetResponse account.
2. Go to **Tools > Integrations and API > API**.
3. Create or copy an API key.
4. Paste it below.`,
    required: true,
    props: {
      apiKey: PieceAuth.SecretText({
        displayName: 'API Key',
        description: 'Your GetResponse API key.',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await validateGetResponseAuth({
          type: AppConnectionType.CUSTOM_AUTH,
          props: { apiKey: auth.apiKey },
        });
        return { valid: true };
      } catch {
        return { valid: false, error: 'Invalid API key.' };
      }
    },
  }),
];

export type GetResponseAuthValue =
  | { type: AppConnectionType.OAUTH2; access_token: string }
  | { type: AppConnectionType.CUSTOM_AUTH; props: { apiKey: string } };
