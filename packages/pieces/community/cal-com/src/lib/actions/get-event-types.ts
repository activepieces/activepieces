import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const getEventTypes = createAction({
  auth: calcomAuth,
  name: 'get_event_types',
  displayName: 'Get Event Types',
  description: 'Retrieve all event types for the authenticated user',
  props: {},
  async run({ auth }) {
    const response = await calComApiCall<{
      status: string;
      data: unknown[];
    }>(auth.secret_text, HttpMethod.GET, '/event-types');

    return response;
  },
});
