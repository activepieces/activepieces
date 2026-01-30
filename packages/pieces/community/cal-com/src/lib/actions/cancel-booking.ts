import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const cancelBooking = createAction({
  auth: calcomAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking',
  props: {
    bookingUid: Property.ShortText({
      displayName: 'Booking UID',
      description: 'The unique identifier of the booking to cancel',
      required: true,
    }),
    cancellationReason: Property.LongText({
      displayName: 'Cancellation Reason',
      description: 'Reason for cancelling the booking',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { bookingUid, cancellationReason } = propsValue;

    const body: Record<string, unknown> = {};

    if (cancellationReason) {
      body['cancellationReason'] = cancellationReason;
    }

    const response = await calComApiCall<{
      status: string;
      data: unknown;
    }>(auth.secret_text, HttpMethod.POST, `/bookings/${bookingUid}/cancel`, body);

    return response;
  },
});
