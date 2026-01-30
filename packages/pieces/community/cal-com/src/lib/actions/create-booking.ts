import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const createBooking = createAction({
  auth: calcomAuth,
  name: 'create_booking',
  displayName: 'Create Booking',
  description: 'Create a new booking for an event type',
  props: {
    eventTypeId: Property.Number({
      displayName: 'Event Type ID',
      description: 'The ID of the event type to book',
      required: true,
    }),
    startTime: Property.DateTime({
      displayName: 'Start Time',
      description: 'Start time of the booking (UTC)',
      required: true,
    }),
    attendeeName: Property.ShortText({
      displayName: 'Attendee Name',
      description: 'Name of the person booking',
      required: true,
    }),
    attendeeEmail: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'Email of the person booking',
      required: true,
    }),
    attendeeTimezone: Property.ShortText({
      displayName: 'Attendee Timezone',
      description: 'Timezone of the attendee (e.g., America/New_York)',
      required: false,
      defaultValue: 'UTC',
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes for the booking',
      required: false,
    }),
    guests: Property.Array({
      displayName: 'Additional Guests',
      description: 'Email addresses of additional guests',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Additional metadata for the booking',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      eventTypeId,
      startTime,
      attendeeName,
      attendeeEmail,
      attendeeTimezone,
      notes,
      guests,
      metadata,
    } = propsValue;

    const body: Record<string, unknown> = {
      eventTypeId,
      start: new Date(startTime).toISOString(),
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: attendeeTimezone || 'UTC',
      },
    };

    if (notes) {
      body['notes'] = notes;
    }

    if (guests && guests.length > 0) {
      body['guests'] = guests;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      body['metadata'] = metadata;
    }

    const response = await calComApiCall<{
      status: string;
      data: unknown;
    }>(auth.secret_text, HttpMethod.POST, '/bookings', body);

    return response;
  },
});
