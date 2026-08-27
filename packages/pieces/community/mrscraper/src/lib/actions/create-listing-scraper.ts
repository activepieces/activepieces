import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const createListingScraper = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_create_listing_scraper',
  classification: 'WRITE',
  displayName: 'Create Listing Scraper',
  description: 'Creates a reusable Listing AI scraper for repeated or paginated content.',
  audience: 'both',
  aiMetadata: { description: 'Create reusable listing extraction configuration with a prompt, item schema, and page limit. Use Extract Listings for immediate extraction. Each call creates new external state and is not idempotent.', idempotent: false },
  props: mrscraperProperties.listing,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.listing(context.propsValue) });
  },
});
