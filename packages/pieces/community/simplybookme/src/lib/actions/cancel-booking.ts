import { createAction } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth, bookingDropdown } from '../common';

export const cancelBooking = createAction({
  auth: simplybookAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking. Returns true on success.',
  audience: 'both',
  aiMetadata: { description: 'Cancels a single existing booking in SimplyBook.me, identified by its booking ID. Use to call off an appointment an agent or client no longer needs. Not idempotent: the underlying cancelBooking call changes booking state, and cancelling an already-cancelled or missing booking may fail.', idempotent: false },
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
