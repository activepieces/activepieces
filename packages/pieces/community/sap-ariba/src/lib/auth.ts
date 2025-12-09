import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const sapAribaAuth = PieceAuth.CustomAuth({
  description: `
Authenticate to SAP Ariba APIs using OAuth and an API Key.

1. Log in to the [SAP Ariba Developer Portal](https://developer.ariba.com/api/).
2. Click **Manage** from the left navigation and select your application.
3. **Application Key**: Copy the value from the **Application Key** field.
4. **OAuth Client ID**: Copy the value from the **OAuth Client ID** field.
5. **OAuth Client Secret**: Click **Actions** > **Generate OAuth Secret**. Copy the secret immediately as it is shown only once.
6. **OAuth Server URL**: Find the **OAuth Server URL Prefix** in the **Environment details** table on the discovery page of any API (e.g., \`https://api.ariba.com\`).
7. **API Base URL**: The runtime URL for the API you wish to access (e.g., \`https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod\`).
  `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'Application Key (apiKey)',
      description: 'The Application Key for your application.',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'OAuth Client ID',
      description: 'The OAuth Client ID for your application.',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'OAuth Client Secret',
      description: 'The OAuth Client Secret generated for your application.',
      required: true,
    }),
    oauthServerUrl: Property.ShortText({
      displayName: 'OAuth Server URL Prefix',
      description: 'The OAuth Server URL (e.g., https://api.ariba.com). Found in Environment details.',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'API Base URL',
      description: 'The API Runtime URL (e.g., https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const credentials = Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('grant_type', 'openapi_2lo');

      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${auth.oauthServerUrl}/v2/oauth/token`,
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      };

      await httpClient.sendRequest(request);
      return { valid: true };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message || 'Invalid credentials',
      };
    }
  },
  required: true,
});
