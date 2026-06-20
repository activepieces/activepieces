import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const DEFAULT_BASE_URL = 'https://api.crawlsnap.com';

const markdownDescription = `
Authenticate with your **CrawlSnap** API key.

1. Open your CrawlSnap dashboard.
2. Create an API key (it starts with \`sk-cs-\`).
3. Paste it below. Override **Base URL** only when targeting a non-production environment.
`;

export const crawlsnapAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your CrawlSnap API key (starts with "sk-cs-").',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Override only when targeting a non-production CrawlSnap environment.',
      required: false,
      defaultValue: DEFAULT_BASE_URL,
    }),
  },
  // Validates the key with a single, low-cost lookup. Note: a successful test
  // consumes one request against your quota.
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.baseUrl || DEFAULT_BASE_URL}/v1/ioc/search/ip`,
        headers: { Authorization: `Bearer ${auth.apiKey}` },
        queryParams: { query: '8.8.8.8' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid CrawlSnap API key or unreachable Base URL.',
      };
    }
  },
});
