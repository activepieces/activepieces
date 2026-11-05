import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBrowserSessionLiveUrlAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_browser_session_live_url',
  displayName: 'Get Browser Session Live URL',
  description: 'Gets the live-view URL of a running browser session.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a URL where a person can watch and control a running Scraping Browser session, for example to solve a login step by hand.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Session Task ID',
      description:
        'The session taskId, from Create Browser Session or List Running Browser Sessions.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.getBrowserSessionLiveUrl({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
