import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomDeclineBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_decline_booking',
  classification: 'DESTRUCTIVE',
  displayName: 'Decline Booking',
  description: 'Decline a Cal.com booking that is pending host confirmation.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Declines a pending booking, notifying the attendee it was not accepted. Only applies to bookings awaiting confirmation. Not idempotent: a repeat call on an already-declined booking errors.',
    idempotent: false,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid, reason } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/decline`,
      version: calcomCommon.versions.bookingsItem,
      body: {
        ...(reason !== undefined ? { reason } : {}),
      },
    });
  },
});
