import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const waitForBrowserSignalAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_wait_for_browser_signal',
  displayName: 'Wait for Browser Signal',
  description: 'Waits for a signal event from a browser session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Waits for the next event with this name on a browser session and returns its data, consuming it from the queue; fails when Timeout passes first. Events are sent by Send Browser Signal or by a script in the session.',
    idempotent: false,
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
      description: 'Event channel name, 1 to 256 characters.',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'How long to wait, 1000 to 60000 ms. Defaults to 60000.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.waitForBrowserSignal({
      auth,
      taskId: propsValue.taskId,
      event: propsValue.event,
      timeout: propsValue.timeout,
    });
  },
});
