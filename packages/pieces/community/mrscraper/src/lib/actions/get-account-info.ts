import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperProperties } from '../common/properties';

export const getAccountInfo = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_get_account_info',
  classification: 'READ',
  displayName: 'Get Account Info',
  description: 'Retrieves MrScraper account details, token usage, and token limits.',
  audience: 'both',
  aiMetadata: { description: 'Read the connected MrScraper account and its token usage or limits. Use for account status, not scraper results. Safe to retry.', idempotent: true },
  props: mrscraperProperties.none,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.GET, path: '/api/v1/subscription-accounts' });
  },
});
