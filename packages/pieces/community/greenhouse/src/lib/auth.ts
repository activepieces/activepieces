import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const greenhouseAuth = PieceAuth.CustomAuth({
  displayName: 'Greenhouse',
  description: `To connect Greenhouse, you need OAuth2 client credentials from a registered API application.

1. Log in to Greenhouse and go to **Configure** (gear icon, top-right).
2. Click **Dev Center** in the left sidebar.
3. Select **OAuth 2.0 Applications** and click **Create New Application**.
4. Set the application type to **Harvest** and copy the **Client ID** and **Client Secret**.

Your credentials are exchanged for a short-lived JWT on every flow run — they are never stored in plain text.`,
  required: true,
  props: {
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description: 'The OAuth2 Client ID from your Greenhouse API application.',
      required: true,
    }),
    client_secret: Property.ShortText({
      displayName: 'Client Secret',
      description: 'The OAuth2 Client Secret from your Greenhouse API application.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const credentials = Buffer.from(`${auth.client_id}:${auth.client_secret}`).toString('base64');
      const response = await httpClient.sendRequest<{ access_token?: string }>({
        method: HttpMethod.POST,
        url: 'https://auth.greenhouse.io/token',
        queryParams: { grant_type: 'client_credentials' },
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.body?.access_token) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Could not obtain access token. Verify your Client ID and Client Secret.',
      };
    } catch {
      return {
        valid: false,
        error:
          'Invalid credentials. Check your Client ID and Client Secret in Greenhouse → Configure → Dev Center → OAuth 2.0 Applications.',
      };
    }
  },
});
