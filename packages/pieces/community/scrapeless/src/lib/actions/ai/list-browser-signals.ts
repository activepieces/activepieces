import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listBrowserSignalsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_browser_signals',
  displayName: 'List Browser Signals',
  description: 'Lists the pending signal events of a browser session.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the names of the signal events waiting in a browser session’s queue, sent by Send Browser Signal or a script in the session.',
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
    return await scrapelessApi.listBrowserSignals({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
