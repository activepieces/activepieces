import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const quickbaseAuth = PieceAuth.CustomAuth({
  description: `
To obtain your Quickbase credentials:
1. Log in to your Quickbase account.
2. Navigate to **My Preferences -> Manage user tokens**.
3. Click **New user token** and copy the token.
4. Your realm hostname is the domain part of your Quickbase URL (e.g., example.quickbase.com).
  `,
  required: true,
  props: {
    userToken: PieceAuth.SecretText({
      displayName: 'User Token',
      description: 'Your Quickbase user token for API access',
      required: true,
    }),
    realm: Property.ShortText({
      displayName: 'Realm Hostname',
      description: 'Your Quickbase realm hostname (e.g., example.quickbase.com)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // Test the authentication by making a simple API request
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.quickbase.com/v1/apps`,
        headers: {
          'QB-Realm-Hostname': auth.realm,
          Authorization: `QB-USER-TOKEN ${auth.userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: 'Invalid Quickbase credentials',
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Authentication failed: ${error.message || 'Invalid user token or realm'}`,
      };
    }
  },
});

export type QuickbaseAuth = {
  userToken: string;
  realm: string;
};

