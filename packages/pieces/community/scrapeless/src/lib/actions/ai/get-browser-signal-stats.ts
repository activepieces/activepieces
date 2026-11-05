import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getBrowserSignalStatsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_browser_signal_stats',
  displayName: 'Get Browser Signal Stats',
  description: 'Counts the queued events and waiters of a browser session.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many signal events are queued and how many waiters are blocked on a browser session.',
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
    return await scrapelessApi.getBrowserSignalStats({
      auth,
      taskId: propsValue.taskId,
    });
  },
});
