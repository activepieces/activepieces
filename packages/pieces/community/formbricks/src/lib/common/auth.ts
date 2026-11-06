import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { formbricksRequest, normalizeAppUrl, toFormbricksError } from './client';

export const formBricksAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
**Create an API key:**
1. Log in to Formbricks.
2. Open **Organization Settings > API Keys**.
3. Click **Add API Key**, give it a label and grant **read & write** access to each workspace you want to automate.
4. Copy the key and paste it below.

**App URL:**
- Formbricks Cloud: \`https://app.formbricks.com\`
- Self-hosted: the address you open Formbricks at, for example \`https://surveys.example.com\`. A trailing slash or \`/api\` is removed automatically.
`,
  props: {
    appUrl: Property.ShortText({
      displayName: 'App URL',
      required: true,
      defaultValue: 'https://app.formbricks.com',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      normalizeAppUrl(auth.appUrl);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid App URL.' };
    }
    try {
      await formbricksRequest({
        auth: { props: { appUrl: auth.appUrl, apiKey: auth.apiKey } },
        method: HttpMethod.GET,
        path: '/api/v1/management/me',
      });
      return { valid: true };
    } catch (error) {
      const mapped = toFormbricksError(error);
      if (mapped?.status === 401 || mapped?.status === 403) {
        return { valid: false, error: 'Formbricks rejected the API key. Create a new key under Organization Settings > API Keys and paste it here.' };
      }
      if (mapped?.status === 404) {
        return { valid: false, error: 'No Formbricks API was found at this App URL. Use the address you open Formbricks at, for example https://app.formbricks.com.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Formbricks. Check the App URL.' };
    }
  },
});
