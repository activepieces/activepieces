import { PieceAuth } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { SAVVYCAL_BASE_URL } from './common';

export const savvyCalAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your SavvyCal account using OAuth2.',
    authUrl: 'https://savvycal.com/oauth/authorize',
    tokenUrl: 'https://savvycal.com/oauth/token',
    required: true,
    scope: [],
  }),
  PieceAuth.CustomAuth({
    displayName: 'Personal Access Token',
    description: `To get your SavvyCal API token:
1. Log in to your SavvyCal account at https://savvycal.com
2. Go to **Settings > Developers**
3. Under **Personal Tokens**, click **Create a token**
4. Give it a name, then click the **...** menu next to it to view the token
5. Copy the **Private Key** (starts with \`pt_secret_\`) — not the Public Key

**Note:** Keep this token secret — it gives full access to your SavvyCal account.`,
    required: true,
    props: {
      token: PieceAuth.SecretText({
        displayName: 'Personal Access Token',
        description: 'Your SavvyCal Personal Access Token (Private Key).',
        required: true,
      }),
    },
    validate: async ({ auth }) => {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${SAVVYCAL_BASE_URL}/me`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.token,
          },
        });
        return { valid: true };
      } catch {
        return { valid: false, error: 'Invalid token. Please check your Personal Access Token and try again.' };
      }
    },
  }),
];

export type SavvyCalAuthValue =
  | { type: AppConnectionType.OAUTH2; access_token: string }
  | { type: AppConnectionType.CLOUD_OAUTH2; access_token: string }
  | { type: AppConnectionType.PLATFORM_OAUTH2; access_token: string }
  | { type: AppConnectionType.CUSTOM_AUTH; props: { token: string } };

export function getToken(auth: SavvyCalAuthValue): string {
  if (
    auth.type === AppConnectionType.OAUTH2 ||
    auth.type === AppConnectionType.CLOUD_OAUTH2 ||
    auth.type === AppConnectionType.PLATFORM_OAUTH2
  ) {
    return auth.access_token;
  }
  return auth.props.token;
}
