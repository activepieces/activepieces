import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  DEFAULT_FAMULOR_HOST,
  famulorRequest,
  resolveFamulorAuth,
} from './client';

export const famulorAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  required: true,
  description: `Connect with a Famulor Platform 2.0 service-account API key.

1. Open [Famulor](https://app.famulor.io) (or your verified whitelabel domain)
2. Go to **Settings → API Keys**
3. Create a key (it starts with \`fam_\`) and paste it below

Do **not** use Classic 1.0 (\`app.famulor.de\`). The tenant is encoded in the key — no workspace header is needed.`,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Service-account key from Settings → API Keys. Starts with fam_.',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'Host only, for verified whitelabel domains. Default is https://app.famulor.io. Do not use app.famulor.de.',
      required: false,
      defaultValue: DEFAULT_FAMULOR_HOST,
    }),
  },
  validate: async ({ auth }) => {
    try {
      resolveFamulorAuth(auth);
      await famulorRequest({
        auth,
        method: HttpMethod.GET,
        path: '/assistants',
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid API key or Base URL. Use https://app.famulor.io or a verified whitelabel domain.',
      };
    }
  },
});
