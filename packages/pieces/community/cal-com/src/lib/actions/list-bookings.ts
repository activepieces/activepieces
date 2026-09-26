import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { listBookingsActionOutputSchema } from '../output-schemas';

const MAX_PAGE_SIZE = 100;

export const calcomListBookings = createAction({
  auth: calcomAuth,
  name: 'calcom_list_bookings',
  classification: 'SEARCH',
  displayName: 'List Bookings',
  description: 'Search Cal.com bookings by status, attendee, event type or date range.',
  audience: 'ai',
  outputSchema: listBookingsActionOutputSchema,
  aiMetadata: {
    description:
      'Lists bookings with optional filters, including a team ID from List Teams. Returns { bookings, nextCursor, hasMore } — pass nextCursor as Cursor on the next call when hasMore is true. Use Get Booking for the full detail of a single result.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Recurring', value: 'recurring' },
          { label: 'Past', value: 'past' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Unconfirmed', value: 'unconfirmed' },
        ],
      },
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      required: false,
    }),
    attendee_name: Property.ShortText({
      displayName: 'Attendee Name',
      required: false,
    }),
    event_type_id: Property.Number({
      displayName: 'Event Type ID',
      required: false,
    }),
    team_id: Property.Number({
      displayName: 'Team ID',
      description: 'Get this from List Teams.',
      required: false,
    }),
    after_start: Property.ShortText({
      displayName: 'Starting After',
      description: 'ISO 8601 timestamp. Only bookings starting after this time.',
      required: false,
    }),
    before_end: Property.ShortText({
      displayName: 'Ending Before',
      description: 'ISO 8601 timestamp. Only bookings ending before this time.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `1-${MAX_PAGE_SIZE}, default 50.`,
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pass the cursor from a previous call to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      status,
      attendee_email,
      attendee_name,
      event_type_id,
      team_id,
      after_start,
      before_end,
      limit,
      cursor,
    } = propsValue;

    const clampedLimit =
      limit === undefined ? undefined : Math.min(Math.max(limit, 1), MAX_PAGE_SIZE);

    const { data, nextCursor, hasMore } = await calcomCommon.calRequestPaginated({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/bookings',
      version: calcomCommon.versions.bookingsList,
      query: {
        status,
        attendeeEmail: attendee_email,
        attendeeName: attendee_name,
        eventTypeId: event_type_id,
        teamId: team_id,
        afterStart: after_start,
        beforeEnd: before_end,
        limit: clampedLimit,
        cursor,
      },
    });

    return { bookings: data, nextCursor, hasMore };
  },
});
