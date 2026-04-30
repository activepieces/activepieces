import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, HttpResponse, HttpMessageBody } from '@activepieces/pieces-common';
import { oroApiCall } from './client';
import { AppConnectionType, tryCatch } from '@activepieces/shared';

export const oroAuth = PieceAuth.CustomAuth({
  description: `
Authenticate to OroCommerce APIs using OAuth 2.0 Client Credentials.

**Steps to obtain credentials:**
1. Log in to your OroCommerce admin panel.
2. Navigate to **System** > **User Management** > **OAuth Applications**.
3. Click **Create OAuth Application** and configure:
   - **Application Name**: Enter a descriptive name (e.g., "Activepieces Integration")
   - **Grants**: Select **Client Credentials**
   - **Redirect URIs**: Not required for Client Credentials flow
4. Save the application and copy the **Client ID** and **Client Secret**.
5. Note your **Server URL** (e.g., \`https://your-store.com\`) and **Admin Prefix** (usually \`admin\`).
  `,
  props: {
    serverUrl: Property.ShortText({
      displayName: 'Server URL',
      description:
        'The base URL of your OroCommerce instance (e.g., https://your-store.com).',
      required: true,
    }),
    adminPrefix: Property.ShortText({
      displayName: 'Admin Prefix',
      description: 'The admin panel URL prefix (default is "admin").',
      required: true,
      defaultValue: 'admin',
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description:
        'The OAuth Client ID from your OroCommerce OAuth application.',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      description:
        'The OAuth Client Secret from your OroCommerce OAuth application.',
      required: true,
    }),
  },

  validate: async ({ auth }): Promise<{ valid: true } | { valid: false; error: string }> => {
    const { error } = await tryCatch<HttpResponse<HttpMessageBody>>(() =>
      oroApiCall({
        method: HttpMethod.GET,
        resourceUri: 'regions/US-CA',
        auth: {
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        },
      }),
    );
    if (error) {
      return {
        valid: false,
        error: error.message ||
          'Invalid credentials. Please verify your Server URL, Admin Prefix, Client ID, and Client Secret.',
      };
    }
    return { valid: true };
  },

  required: true,
});
