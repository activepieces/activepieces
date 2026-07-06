import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamhoodApiCall, TeamhoodAuth } from './client';

export const teamhoodAuth = PieceAuth.CustomAuth({
  required: true,
  description: `Connect your Teamhood account to use this piece.

**How to get your credentials:**
1. Log in to your Teamhood account at https://app.teamhood.com.
2. Open **Settings → Integrations → Teamhood API**.
3. Copy your  API key.
4. Your **API URL** is shown on the same page. It looks like \`https://api-YOURTENANT.teamhood.com\` — replace \`YOURTENANT\` with the subdomain from the URL you use to log in.`,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'API URL',
      description:
        'Your tenant-specific Teamhood API URL (e.g. https://api-YOURTENANT.teamhood.com).',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Teamhood API key generated from Settings → Integrations → Teamhood API in Teamhood.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await teamhoodApiCall({
        auth: auth as TeamhoodAuth,
        method: HttpMethod.GET,
        path: '/workspaces',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid Teamhood credentials. Double-check your API URL and API key in Settings → Integrations → Teamhood API.',
      };
    }
  },
});
