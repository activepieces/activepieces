import { createAction, Property } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall, flattenEvent, SavvyCalEvent } from '../common';
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
      defaultValue: 100,
    }),
  },
  async run(context) {
    const events = await savvyCalPaginatedCall<SavvyCalEvent>({
      token: context.auth as unknown as string,
      path: '/events',
    });

    const maxResults = context.propsValue.limit ?? 100;
    return events.slice(0, maxResults).map(flattenEvent);
  },
});
