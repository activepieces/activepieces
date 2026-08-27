import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const getResults = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_get_results',
  classification: 'SEARCH',
  displayName: 'Get Results',
  description: 'Lists one paginated, sorted page of results for a scraper.',
  audience: 'both',
  aiMetadata: { description: 'List a specific page of results for one scraper with page size and sort order. Use Get Latest Results when only the newest N items matter, or Get Result Detail for one known result ID. Safe to retry.', idempotent: true },
  props: mrscraperProperties.results,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.GET, path: '/api/v1/results', queryParams: mrscraperPayloads.resultsQuery(context.propsValue) });
  },
});
