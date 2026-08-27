import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const runExistingScraperBatch = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_run_existing_scraper_batch',
  classification: 'WRITE',
  displayName: 'Run Existing Scraper Batch',
  description: 'Runs multiple URLs with one existing AI or Manual scraper.',
  audience: 'both',
  aiMetadata: { description: 'Run a nonempty URL list through one existing AI or Manual scraper using the matching bulk endpoint. Use Run Existing Scraper for one URL and its mode-specific settings. Each call queues new work and is not idempotent.', idempotent: false },
  props: mrscraperProperties.batch,
  async run(context) {
    const request = mrscraperPayloads.batchRun(context.propsValue);
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.POST, path: request.path, body: request.body });
  },
});
