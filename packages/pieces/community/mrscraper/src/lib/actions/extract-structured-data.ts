import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const extractStructuredData = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_extract_structured_data',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Extracts one page using an exact category-specific structured-data preset.',
  audience: 'both',
  aiMetadata: { description: 'Extract a page using a bundled preset for articles, products, properties, restaurants, jobs, profiles, and other supported categories. Choose this instead of free-form prompt extraction when a preset category fits. Not safely retryable.', idempotent: false },
  props: mrscraperProperties.structured,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.structured(context.propsValue) });
  },
});
