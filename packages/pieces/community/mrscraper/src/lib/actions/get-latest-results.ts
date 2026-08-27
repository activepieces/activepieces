import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const getLatestResults = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_get_latest_results',
  classification: 'SEARCH',
  displayName: 'Get Latest Results',
  description: 'Returns the newest requested number of results for a scraper.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the newest N results for one scraper in descending creation order. Use Get Results for arbitrary pagination and sorting, or Get Result Detail for one known result. Safe to retry.', idempotent: true },
  props: mrscraperProperties.latest,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.GET, path: '/api/v1/results', queryParams: mrscraperPayloads.latestQuery(context.propsValue) });
  },
});
