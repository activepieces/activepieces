import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomCreateBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_create_booking',
  classification: 'WRITE',
  displayName: 'Create Booking',
  description: 'Book a Cal.com event type at a specific start time for one attendee.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a standard (non-recurring, non-instant) booking for an event type at an exact start time. Use Get Available Slots first to find a valid start time. The booking status is ACCEPTED, or PENDING if the event type requires host confirmation (use Confirm Booking / Decline Booking to resolve it). Not idempotent: each call creates a new booking, so retries duplicate.',
    idempotent: false,
  },
  props: {
    event_type_id: Property.Number({
      displayName: 'Event Type ID',
      description: 'Get this from List Event Types.',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 timestamp in UTC, e.g. 2026-03-05T15:00:00Z. Get a valid value from Get Available Slots.',
      required: true,
    }),
    attendee_name: Property.ShortText({
      displayName: 'Attendee Name',
      required: true,
    }),
    attendee_time_zone: Property.ShortText({
      displayName: 'Attendee Timezone',
      description: 'IANA timezone, e.g. Europe/Berlin. Get valid values from List Timezones.',
      required: true,
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      required: false,
    }),
    attendee_phone_number: Property.ShortText({
      displayName: 'Attendee Phone Number',
      description: 'International format, e.g. +14155552671.',
      required: false,
    }),
    guests: Property.Array({
      displayName: 'Guest Emails',
      required: false,
    }),
    length_in_minutes: Property.Number({
      displayName: 'Length (Minutes)',
      description: 'Only for event types offering multiple possible durations.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const {
      event_type_id,
      start,
      attendee_name,
      attendee_time_zone,
      attendee_email,
      attendee_phone_number,
      guests,
      length_in_minutes,
    } = propsValue;

    const body: Record<string, unknown> = {
      eventTypeId: event_type_id,
      start,
      attendee: {
        name: attendee_name,
        timeZone: attendee_time_zone,
        ...(attendee_email !== undefined ? { email: attendee_email } : {}),
        ...(attendee_phone_number !== undefined ? { phoneNumber: attendee_phone_number } : {}),
      },
    };
    if (guests !== undefined) body['guests'] = guests;
    if (length_in_minutes !== undefined) body['lengthInMinutes'] = length_in_minutes;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/bookings',
      version: calcomCommon.versions.bookingsItem,
      body,
    });
  },
});
