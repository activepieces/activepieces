import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const createPromptScraper = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_create_prompt_scraper',
  classification: 'WRITE',
  displayName: 'Create Prompt Scraper',
  description: 'Creates a reusable General AI scraper from a URL, prompt, and optional output schema.',
  audience: 'both',
  aiMetadata: { description: 'Create reusable prompt-based scraper configuration for later single or batch runs. Use Extract Page by Prompt for an immediate one-off extraction. Each call creates new external state and is not idempotent.', idempotent: false },
  props: mrscraperProperties.general,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: '/api/v1/scrapers-ai', body: mrscraperPayloads.general(context.propsValue) });
  },
});
