import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const cancelBookingAction = createAction({
  auth: simplyBookAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking',
  props: {
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'ID of the booking to cancel',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Cancellation Reason',
      description: 'Reason for cancellation',
      required: false,
    }),
  },
  async run(context) {
    const { bookingId, reason } = context.propsValue;
    
    const params = {
      booking_id: bookingId,
      ...(reason && { reason }),
    };

    return await makeApiRequest(context.auth, 'cancelBooking', params);
  },
});
