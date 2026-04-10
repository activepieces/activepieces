import { createAction, Property } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall, flattenEvent, SavvyCalEvent } from '../common';
import { savvyCalAuth } from '../../';

export const findEventsByEmailAction = createAction({
  auth: savvyCalAuth,
  name: 'find_events_by_email',
  displayName: 'Find Events by Attendee Email',
  description: "Returns all events where the attendee's email matches the given address.",
  props: {
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'The email address of the attendee to search for.',
      required: true,
    }),
    start_after: Property.DateTime({
      displayName: 'Start After',
      description: 'Only search events starting after this date. Use this to limit the search scope and improve performance.',
      required: false,
    }),
    start_before: Property.DateTime({
      displayName: 'Start Before',
      description: 'Only search events starting before this date.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const { attendee_email, start_after, start_before } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (start_after) queryParams['start_after'] = start_after;
    if (start_before) queryParams['start_before'] = start_before;

    const events = await savvyCalPaginatedCall<SavvyCalEvent>({
      token,
      path: '/events',
      queryParams,
    });

    const normalizedEmail = attendee_email.toLowerCase().trim();
    return events
      .filter((e) => e.attendees?.some((a) => a.email?.toLowerCase() === normalizedEmail))
      .map(flattenEvent);
  },
});
