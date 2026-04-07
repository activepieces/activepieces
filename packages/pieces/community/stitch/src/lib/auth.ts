import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const stitchAuth = PieceAuth.CustomAuth({
  displayName: 'Stitch Connection',
  required: true,
  description: `Connect your Stitch account using API tokens.

**Step 1 — Get your Connect API token:**
1. Log in to [Stitch](https://app.stitchdata.com)
2. Go to **Account Settings** (top-right menu)
3. Click **API Access Tokens**
4. Click **Generate New Token**, give it a name, and copy the token

**Step 2 — Get your Import API token (only needed for Push Records / Validate Records):**
1. In Stitch, go to **Connections → Add Integration**
2. Search for **Import API** and add it
3. Open the Import API integration settings to find your token

**Step 3 — Get your Client ID:**
1. In Stitch, go to **Account Settings**
2. Your **Client ID** is the numeric ID shown at the top of the page`,
  props: {
    connect_api_token: PieceAuth.SecretText({
      displayName: 'Connect API Token',
      description: 'Your Stitch Connect API access token (from Account Settings → API Access Tokens). Required for managing sources and destinations.',
      required: true,
    }),
    import_api_token: PieceAuth.SecretText({
      displayName: 'Import API Token',
      description: 'Your Stitch Import API access token (from the Import API integration settings). Required for Push Records and Validate Records actions.',
      required: false,
    }),
    client_id: Property.ShortText({
      displayName: 'Client ID',
      description: 'Your numeric Stitch Client ID (found in Account Settings). Required for Import API actions.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.stitchdata.com/v4/sources',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.connect_api_token,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Connect API token. Please check your token and try again.' };
    }
  },
});
