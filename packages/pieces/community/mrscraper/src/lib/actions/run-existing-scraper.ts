import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const runExistingScraper = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_run_existing_scraper',
  classification: 'WRITE',
  displayName: 'Run Existing Scraper',
  description: 'Runs one URL with an existing AI General, Listing, Map, or Manual scraper.',
  audience: 'both',
  aiMetadata: { description: 'Run one URL through an existing AI or Manual scraper, with settings validated for the chosen mode. Use Run Existing Scraper Batch for multiple URLs. Each call queues new work and is not idempotent.', idempotent: false },
  props: mrscraperProperties.runExisting,
  propertyGroups: [
    { key: 'run', display: 'section', label: 'Run', icon: 'send', props: ['scraper_type', 'scraper_id', 'url', 'max_retry', 'proxy_country', 'agent_type', 'timeout'] },
    { key: 'ai_configuration', display: 'section', label: 'AI Scraper Configuration', icon: 'sliders', props: ['max_pages', 'max_depth', 'limit', 'include_patterns', 'exclude_patterns'] },
  ],
  async run(context) {
    const request = mrscraperPayloads.singleRun(context.propsValue);
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: request.path, body: request.body });
  },
});
