import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomRescheduleBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_reschedule_booking',
  classification: 'WRITE',
  displayName: 'Reschedule Booking',
  description: 'Move a Cal.com booking to a new start time.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Reschedules a booking to a new start time; the vendor issues a new booking uid for the moved booking, returned in the response. Use Get Available Slots to find a valid new time. Not idempotent: repeating the same call reschedules again.',
    idempotent: false,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'New Start Time',
      description: 'ISO 8601 timestamp.',
      required: true,
    }),
    rescheduling_reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid, start, rescheduling_reason } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/reschedule`,
      version: calcomCommon.versions.bookingsItem,
      body: {
        start,
        ...(rescheduling_reason !== undefined ? { reschedulingReason: rescheduling_reason } : {}),
      },
    });
  },
});
