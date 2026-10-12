import { createAction } from '@activepieces/pieces-framework';
import { webscrapingAiAuth } from '../auth';
import { webscrapingAiApi } from '../common/api';
import { humanAccountOutputSchema } from '../output-schemas';

export const getAccountInformationAction = createAction({
  auth: webscrapingAiAuth,
  name: 'getAccountInformation',
  outputSchema: humanAccountOutputSchema,
  classification: 'READ',
  displayName: 'Get Account Info',
  description: 'Get account usage information including remaining API credits and concurrent requests.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up the WebScraping AI account status, including remaining API credits and concurrent-request limits. Choose this to check quota or capacity before running a batch of scraping calls, or to surface usage to the caller. Takes no inputs beyond the connection. Read-only and idempotent (a GET-style lookup).',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await webscrapingAiApi.getAccount({ auth });
  },
});
