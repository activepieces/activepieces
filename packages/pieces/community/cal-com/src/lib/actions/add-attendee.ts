import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { addAttendeeActionOutputSchema } from '../output-schemas';

export const calcomAddAttendee = createAction({
  auth: calcomAuth,
  name: 'calcom_add_attendee',
  classification: 'WRITE',
  displayName: 'Add Attendee to Booking',
  description: 'Add an additional attendee to an existing Cal.com booking.',
  audience: 'ai',
  outputSchema: addAttendeeActionOutputSchema,
  aiMetadata: {
    description:
      'Adds one attendee to an existing booking. Get the booking uid from List Bookings or Get Booking. Not idempotent: each call adds another attendee, so retries duplicate.',
    idempotent: false,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attendee Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Attendee Email',
      required: true,
    }),
    time_zone: Property.ShortText({
      displayName: 'Attendee Timezone',
      description: 'IANA timezone, e.g. Europe/Berlin. Get valid values from List Timezones.',
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Attendee Phone Number',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid, name, email, time_zone, phone_number } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/attendees`,
      version: calcomCommon.versions.attendees,
      body: {
        name,
        email,
        timeZone: time_zone,
        ...(phone_number !== undefined ? { phoneNumber: phone_number } : {}),
      },
    });
  },
});
