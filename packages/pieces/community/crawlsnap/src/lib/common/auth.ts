import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
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
    } catch (e) {
      // Only 401/403 actually mean a bad key; surface other failures (rate
      // limits, server or network errors) accurately instead of blaming the key.
      if (e instanceof HttpError) {
        const status = e.response.status;
        if (status === 401 || status === 403) {
          return { valid: false, error: 'Invalid CrawlSnap API key.' };
        }
        return {
          valid: false,
          error: `CrawlSnap returned HTTP ${status}. Check the Base URL or try again later.`,
        };
      }
      return {
        valid: false,
        error: 'Could not reach CrawlSnap. Check the Base URL and your connection.',
      };
    }
  },
});
