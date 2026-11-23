import { createAction, Property } from '@activepieces/pieces-framework';
import { savvyCalCollect, buildEventQuery, flattenEvent, SavvyCalEvent } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const findEventsByEmailAction = createAction({
  auth: savvyCalAuth,
  name: 'find_events_by_email',
  classification: 'SEARCH',
  displayName: 'Find Events by Attendee Email',
  description: "Returns all events where the attendee's email matches the given address.",
  audience: 'both',
  aiMetadata: { description: 'Finds all SavvyCal events, past and upcoming, that have a given email among their attendees, in any state. Use to look up a specific person\'s bookings when you only know their email; optionally narrow with a start-date window. Match is case-insensitive on the attendee email. Read-only and idempotent.', idempotent: true },
  props: {
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'The email address of the attendee to search for.',
      required: true,
    }),
    start_after: Property.DateTime({
      displayName: 'Start After',
      description: 'Only search events starting at or after this date. Leave empty to search all past and upcoming events.',
      required: false,
    }),
    start_before: Property.DateTime({
      displayName: 'Start Before',
      description: 'Only search events starting at or before this date.',
      required: false,
    }),
  },
  async run(context) {
    const { attendee_email, start_after, start_before } = context.propsValue;
    const normalizedEmail = attendee_email.toLowerCase().trim();

    const { queryParams, keep } = buildEventQuery({
      period: 'all',
      startAfter: start_after,
      startBefore: start_before,
      search: normalizedEmail,
      includeEventsNotAttending: true,
    });

    const events = await savvyCalCollect<SavvyCalEvent>({
      token: getToken(context.auth),
      path: '/events',
      queryParams,
      keep: (event) => (keep ? keep(event) : true) && hasAttendeeEmail({ event, email: normalizedEmail }),
    });
    return events.map(flattenEvent);
  },
});

function hasAttendeeEmail({ event, email }: { event: SavvyCalEvent; email: string }): boolean {
  return (event.attendees ?? []).some((attendee) => attendee.email?.toLowerCase() === email);
}
