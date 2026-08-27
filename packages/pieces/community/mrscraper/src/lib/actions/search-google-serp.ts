import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const searchGoogleSerp = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_search_google_serp',
  classification: 'SEARCH',
  displayName: 'Search Google SERP',
  description: 'Searches Google synchronously and returns structured JSON or HTML.',
  audience: 'both',
  aiMetadata: { description: 'Search Google for a query with region, language, page, and optional JavaScript rendering. Pick JSON for structured results or HTML for page text. Safe to retry.', idempotent: true },
  props: mrscraperProperties.serp,
  async run(context) {
    const request = mrscraperPayloads.serp(context.propsValue);
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'serp', method: HttpMethod.POST, path: '/api/google/serp/v2/sync', body: request.body, responseType: request.format === 'html' ? 'text' : 'json' });
  },
});
