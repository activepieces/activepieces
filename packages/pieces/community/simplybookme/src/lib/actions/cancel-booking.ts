import { createAction } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth, bookingDropdown } from '../common';

export const cancelBooking = createAction({
  auth: simplybookAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking. Returns true on success.',
  props: {
    bookingId: bookingDropdown
  },
  async run(context) {
    const auth = context.auth.props;
    const { bookingId } = context.propsValue;

    const params = [bookingId];
    const result = await makeJsonRpcCall<boolean>(auth, 'cancelBooking', params);

    return { success: result };
  }
});
