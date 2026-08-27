import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const extractListings = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_extract_listings',
  classification: 'SEARCH',
  displayName: 'Extract Listings',
  description: 'Immediately extracts repeated listings or paginated content from a website.',
  audience: 'both',
  aiMetadata: { description: 'Extract repeated items across listing pages now, with an optional per-item JSON schema. Use Create Listing Scraper for reusable configuration. Each call starts new work and is not safely retryable.', idempotent: false },
  props: mrscraperProperties.listing,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.listing(context.propsValue) });
  },
});
