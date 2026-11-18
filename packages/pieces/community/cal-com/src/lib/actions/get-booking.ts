import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomGetBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_get_booking',
  classification: 'READ',
  displayName: 'Get Booking',
  description: 'Get the full details of a single Cal.com booking by its uid, including its attendees.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves full details for one booking by uid, including its attendees. Get the uid from List Bookings or from a booking trigger payload.',
    idempotent: true,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      description: 'Get this from List Bookings.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/bookings/${booking_uid}`,
      version: calcomCommon.versions.bookingsItem,
    });
  },
});
