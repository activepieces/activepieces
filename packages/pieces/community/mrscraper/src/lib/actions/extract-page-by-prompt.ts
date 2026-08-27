import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const extractPageByPrompt = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_extract_page_by_prompt',
  classification: 'READ',
  displayName: 'Extract Page by Prompt',
  description: 'Immediately extracts data from one page using a prompt and optional JSON schema.',
  audience: 'both',
  aiMetadata: { description: 'Extract one page now with natural-language instructions and an optional output schema. Use Create Prompt Scraper for a reusable scraper. Each call starts new extraction work, so avoid blind retries.', idempotent: false },
  props: mrscraperProperties.general,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.general(context.propsValue) });
  },
});
