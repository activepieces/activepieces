import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const sendBrowserSignalAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_send_browser_signal',
  displayName: 'Send Browser Signal',
  description: 'Sends a signal event to a running browser session.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a named event with an optional data payload on a browser session, for a script in the session (or Wait for Browser Signal) to consume. Up to 100 events are cached; signals are not isolated per session.',
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
    data: Property.Json({
      displayName: 'Data',
      description:
        'Optional JSON object sent with the event, e.g. {"status": "ready"}.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.sendBrowserSignal({
      auth,
      taskId: propsValue.taskId,
      event: propsValue.event,
      data: propsValue.data,
    });
  },
});
