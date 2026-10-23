import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const clearBrowserSignalsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_clear_browser_signals',
  displayName: 'Clear Browser Signals',
  description: 'Clears queued signal events from a browser session.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes queued signal events from a browser session, only those with Event when set, otherwise all of them, and returns how many were cleared. Signals are not isolated per session, so this can remove events other sessions would read.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Session Task ID',
      description:
        'The session taskId, from Create Browser Session or List Running Browser Sessions.',
      required: true,
    }),
    event: Property.ShortText({
      displayName: 'Event',
      description:
        'Only clear events with this name. Leave empty to clear all.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.clearBrowserSignals({
      auth,
      taskId: propsValue.taskId,
      event: propsValue.event,
    });
  },
});
