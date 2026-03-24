import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, savvyCalPaginatedCall, flattenEvent, SavvyCalEvent } from '../common';
import { savvyCalAuth } from '../../';

export const listEventsAction = createAction({
  auth: savvyCalAuth,
  name: 'list_events',
  displayName: 'List Events',
  description: 'Returns a list of scheduled meetings from your SavvyCal account.',
  props: {
    limit: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of events to return. Leave empty to return all events.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth as unknown as string;
    const maxResults = context.propsValue.limit;

    if (maxResults) {
      const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
        token,
        method: HttpMethod.GET,
        path: '/events',
        queryParams: { limit: String(maxResults) },
      });
      return response.body.entries.map(flattenEvent);
    }

    const events = await savvyCalPaginatedCall<SavvyCalEvent>({ token, path: '/events' });
    return events.map(flattenEvent);
  },
});
