import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { bookingActionOutputSchema } from '../output-schemas';

export const calcomConfirmBooking = createAction({
  auth: calcomAuth,
  name: 'calcom_confirm_booking',
  classification: 'WRITE',
  displayName: 'Confirm Booking',
  description: 'Confirm a Cal.com booking that is pending host confirmation.',
  audience: 'ai',
  outputSchema: bookingActionOutputSchema,
  aiMetadata: {
    description:
      'Confirms a pending booking, finalizing it. Only applies to bookings whose event type requires manual confirmation. Idempotent: confirming an already-confirmed booking is a no-op.',
    idempotent: true,
  },
  props: {
    booking_uid: Property.ShortText({
      displayName: 'Booking UID',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { booking_uid } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: `/bookings/${booking_uid}/confirm`,
      version: calcomCommon.versions.bookingsItem,
      body: {},
    });
  },
});
