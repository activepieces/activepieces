import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calComApiCall } from '../common';

export const getBooking = createAction({
  auth: calcomAuth,
  name: 'get_booking',
  displayName: 'Get Booking',
  description: 'Retrieve a specific booking by its UID',
  props: {
    bookingUid: Property.ShortText({
      displayName: 'Booking UID',
      description: 'The unique identifier of the booking',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { bookingUid } = propsValue;

    const response = await calComApiCall<{
      status: string;
      data: unknown;
    }>(auth.secret_text, HttpMethod.GET, `/bookings/${bookingUid}`);

    return response;
  },
});
