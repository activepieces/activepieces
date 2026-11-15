import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomCancelBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_cancel_booking',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Booking',
  description: 'Cancel an active Cal.com booking by its uid.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Cancels an active booking by uid, notifying the attendee. Get the uid from List Bookings or Get Booking. Not idempotent: a repeat call on an already-cancelled booking errors.',
    idempotent: false,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
    cancellation_reason: Property.LongText({
      displayName: 'Cancellation Reason',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid, cancellation_reason } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/cancel`,
      version: calcomCommon.versions.bookingsItem,
      body: {
        ...(cancellation_reason !== undefined ? { cancellationReason: cancellation_reason } : {}),
      },
    });
  },
});
