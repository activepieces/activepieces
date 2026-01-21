import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const sapAribaAuth = PieceAuth.CustomAuth({
  description: `
Authenticate to SAP Ariba APIs.

**Option 1: API Key Only**
- Fill in only Application Key and API Base URL.

**Option 2: OAuth + API Key**
- Fill in all fields including OAuth Client ID, Client Secret, and OAuth Server URL.

**Steps:**
1. Log in to the [SAP Ariba Developer Portal](https://developer.ariba.com/api/).
2. Click **Manage** and select your application.
3. **Application Key**: Copy from the **Application Key** field.
4. **OAuth Client ID** (optional): Copy from the **OAuth Client ID** field.
5. **OAuth Client Secret** (optional): Click **Actions** > **Generate OAuth Secret**. Copy immediately.
6. **OAuth Server URL** (optional): Find in **Environment details** (e.g., \`https://api.ariba.com\`).
7. **API Base URL**: The API runtime URL (e.g., \`https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod\`).
  `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'Application Key (APIKey)',
      description: 'The Application Key for your application.',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'API Base URL',
      description: 'The API Runtime URL (e.g., https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod).',
      required: true,
    }),
    clientId: Property.ShortText({
      displayName: 'OAuth Client ID',
      description: 'The OAuth Client ID (optional, for OAuth authentication).',
      required: false,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'OAuth Client Secret',
      description: 'The OAuth Client Secret (optional, for OAuth authentication).',
      required: false,
    }),
    oauthServerUrl: Property.ShortText({
      displayName: 'OAuth Server URL Prefix',
      description: 'The OAuth Server URL (optional, e.g., https://api.ariba.com).',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      // If OAuth credentials provided, validate them
      if (auth.clientId && auth.clientSecret && auth.oauthServerUrl) {
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
      }
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
