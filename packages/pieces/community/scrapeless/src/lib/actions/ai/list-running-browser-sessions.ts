import { createAction } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listRunningBrowserSessionsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_running_browser_sessions',
  displayName: 'List Running Browser Sessions',
  description: 'Lists the Scraping Browser sessions that are running now.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Scraping Browser sessions running right now, with each taskId, state, creation and expiry time. Use the taskId with Get Browser Session Live URL or the signal actions.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await scrapelessApi.listRunningBrowserSessions({ auth });
  },
});
