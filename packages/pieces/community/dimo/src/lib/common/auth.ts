import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DIMO_API_URLS } from './constants';

export const dimoDeveloperAuth = PieceAuth.CustomAuth({
  description: `
## DIMO Developer Authentication

To use DIMO actions that require a Developer JWT:

1. Register as a licensed developer at [DIMO Developer Console](https://console.dimo.org/)
2. Create a Developer License and generate an **API Key**
3. Note your **Client ID** and **Redirect URI**

For **Vehicle JWT** actions, you will also need a Vehicle Token ID (from a vehicle that has shared permissions with your app).

### How to get a Developer JWT

You can obtain a Developer JWT using the [DIMO Data SDK](https://github.com/DIMO-Network/data-sdk):

\`\`\`typescript
import { DIMO } from '@dimo-network/data-sdk';
const dimo = new DIMO('Production');
const developerJwt = await dimo.auth.getDeveloperJwt({
  client_id: '<your_client_id>',
  domain: '<your_redirect_uri>',
  private_key: '<your_api_key>',
});
\`\`\`
  `,
  props: {
    developer_jwt: Property.ShortText({
      displayName: 'Developer JWT',
      description: 'Your DIMO Developer JWT token. Obtain this via the DIMO SDK or Developer Console.',
      required: false,
    }),
    vehicle_jwt: Property.ShortText({
      displayName: 'Vehicle JWT',
      description: 'A Vehicle JWT for vehicle-specific API calls. Obtain via Token Exchange API after user grants permissions.',
      required: false,
    }),
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description: 'Your DIMO Developer License Client ID (required for Token Exchange actions).',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const { developer_jwt, vehicle_jwt, client_id } = auth as {
      developer_jwt?: string;
      vehicle_jwt?: string;
      client_id?: string;
    };

    if (!developer_jwt && !vehicle_jwt) {
      return {
        valid: false,
        error: 'Please provide at least a Developer JWT or Vehicle JWT.',
      };
    }

    // Validate developer JWT by calling the identity API
    if (developer_jwt) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks`,
          headers: {
            Authorization: `Bearer ${developer_jwt}`,
          },
        });
        return { valid: true };
      } catch (e: any) {
        if (e?.response?.status === 401) {
          return {
            valid: false,
            error: 'Invalid Developer JWT. Please check your token.',
          };
        }
        // Other errors (network, etc.) - we'll accept anyway
        return { valid: true };
      }
    }

    return { valid: true };
  },
  required: true,
});

export type DimoAuthProps = {
  developer_jwt?: string;
  vehicle_jwt?: string;
  client_id?: string;
};
