import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
**How to get your Qawafel API Key:**

1. Sign in to your [Qawafel dashboard](https://qawafel.sa).
2. Open **Settings → Developers → API Keys**.
3. Click **Create API Key**, give it a name (e.g. "Activepieces") and copy the key.
4. Paste the key below. Keep it secret — anyone with the key can read and write your Qawafel data.

**Environment:**

- **Production** — live Qawafel tenant at \`core.qawafel.sa\`.
- **Development** — sandbox tenant at \`core.development.qawafel.dev\` for testing without touching live data.

API keys are scoped to a single environment. Pick the same one the key was created in.
`;

export const qawafelAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Pick the Qawafel environment your API key belongs to.',
      required: true,
      defaultValue: 'production',
      options: {
        disabled: false,
        options: [
          { label: 'Production', value: 'production' },
          { label: 'Development', value: 'development' },
        ],
      },
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Qawafel API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${resolveQawafelBaseUrl(auth.environment)}/tenant`,
        headers: {
          'x-qawafel-api-key': auth.apiKey,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not authenticate. Double-check the API Key, and make sure you picked the same environment (Production or Development) the key was created in.',
      };
    }
  },
});

export function getQawafelBaseUrl(auth: QawafelAuth): string {
  return resolveQawafelBaseUrl(auth.props.environment);
}

function resolveQawafelBaseUrl(environment: string | undefined): string {
  return environment === 'development'
    ? DEVELOPMENT_API_BASE_URL
    : PRODUCTION_API_BASE_URL;
}

export const PRODUCTION_API_BASE_URL = 'https://core.qawafel.sa/api/v1';
export const DEVELOPMENT_API_BASE_URL =
  'https://core.development.qawafel.dev/api/v1';
export type QawafelAuth = AppConnectionValueForAuthProperty<typeof qawafelAuth>;
