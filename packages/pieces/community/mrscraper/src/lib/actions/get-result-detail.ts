import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mrscraperAuth } from '../auth';
import { mrscraperApi } from '../common/http';
import { mrscraperPayloads } from '../common/payloads';
import { mrscraperProperties } from '../common/properties';

export const getResultDetail = createAction({
  auth: mrscraperAuth,
  name: 'mrscraper_get_result_detail',
  classification: 'READ',
  displayName: 'Get Result Detail',
  description: 'Retrieves one complete scraper result by its result ID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve one known result by exact result ID. Use the list or latest actions when the ID is not known. Safe to retry.', idempotent: true },
  props: mrscraperProperties.detail,
  async run(context) {
    return mrscraperApi.request({ token: context.auth.secret_text, origin: 'primary', method: HttpMethod.GET, path: mrscraperPayloads.detailPath(context.propsValue.result_id) });
  },
});
