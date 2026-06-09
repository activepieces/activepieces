import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth, webscrapingAiCommon } from '../common';

export const getAccountInformation = createAction({
  auth: webscrapingAiAuth,
  name: 'getAccountInformation',
  displayName: 'Get Account Info',
  description: 'Get account usage information including remaining API credits and concurrent requests.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up the WebScraping AI account status, including remaining API credits and concurrent-request limits. Choose this to check quota or capacity before running a batch of scraping calls, or to surface usage to the caller. Takes no inputs beyond the connection. Read-only and idempotent (a GET-style lookup).',
    idempotent: true,
  },
  props: {},
  async run({ auth: apiKey }) {
    return await webscrapingAiCommon.getAccountInformation({ apiKey:apiKey.secret_text });
  },
});
