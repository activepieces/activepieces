import { createAction } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetAccountOutputSchema } from '../output-schemas';

export const getAccountAction = createAction({
  name: 'supadata_get_account',
  outputSchema: supadataGetAccountOutputSchema,
  displayName: 'Get Account',
  description: 'Fetches the organization, plan and credit usage of the API key.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the organization id, plan and credit usage (used and maximum) of the connected Supadata account. Use to check remaining credits before starting batch, crawl or extraction jobs. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
  },
  async run(context) {
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/me',
    });
  },
});
