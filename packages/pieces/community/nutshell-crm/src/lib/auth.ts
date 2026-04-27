import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const nutshellAuth = PieceAuth.CustomAuth({
  required: true,
  description: `Authenticate with your Nutshell CRM account.

1. Log in to your Nutshell account.
2. Go to **Setup** > **API & Integrations**.
3. Create a new API key or copy an existing one.
4. Use your account email and API key below.`,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your Nutshell account email address',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Nutshell API key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.nutshell.com/api/v1/json',
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.email,
          password: auth.apiKey,
        },
        body: [{ method: 'getUsers', params: {}, id: 1 }],
        headers: { 'Content-Type': 'application/json' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid credentials' };
    }
  },
});

export interface NutshellAuthType {
  email: string;
  apiKey: string;
}
