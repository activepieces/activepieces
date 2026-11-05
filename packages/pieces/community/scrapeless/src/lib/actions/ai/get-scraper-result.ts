import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getScraperResultAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_scraper_result',
  displayName: 'Get Scraper Result',
  description: 'Gets the result of a scraper task by its task id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Checks a scraper task once by taskId and returns its result when finished (completed true) or completed false while it is still running; call again later. The taskId comes from Run Scraper or any search or get action that returned completed false.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The taskId returned by Run Scraper or another scraper action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.getScraperResult({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
