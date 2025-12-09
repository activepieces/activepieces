import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

const oauthAuth = PieceAuth.CustomAuth({
  displayName: 'OAuth Authentication',
  description: `
Authenticate using OAuth and an API Key.

1. Log in to the [SAP Ariba Developer Portal](https://developer.ariba.com/api/).
2. Click **Manage** and select your application.
3. **Application Key**: Copy from the **Application Key** field.
4. **OAuth Client ID**: Copy from the **OAuth Client ID** field.
5. **OAuth Client Secret**: Click **Actions** > **Generate OAuth Secret**. Copy immediately.
6. **OAuth Server URL**: Find in **Environment details** (e.g., \`https://api.ariba.com\`).
7. **API Base URL**: The API runtime URL (e.g., \`https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod\`).
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
      description: 'The OAuth Server URL (e.g., https://api.ariba.com).',
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
        error: e?.message || 'Invalid OAuth credentials',
      };
    }
  },
  required: true,
});

const apiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'API Key Authentication',
  description: `
Authenticate using only an API Key (simpler setup).

1. Log in to the [SAP Ariba Developer Portal](https://developer.ariba.com/api/).
2. Click **Manage** and select your application.
3. **Application Key**: Copy from the **Application Key** field.
4. **API Base URL**: The API runtime URL (e.g., \`https://openapi.ariba.com/api/purchase-orders-buyer/v1/prod\`).
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
  },
  required: true,
});

export const sapAribaAuth = [oauthAuth, apiKeyAuth];
