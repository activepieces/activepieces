import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth, bookingDropdown } from '../common';

export const createBookingComment = createAction({
  auth: simplybookAuth,
  name: 'create_booking_comment',
  displayName: 'Set Booking Comment',
  description: 'Set a comment for a booking',
  props: {
    bookingId: bookingDropdown,
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to set for the booking',
      required: true
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const { bookingId, comment } = context.propsValue;

    const params = [bookingId, comment];
    const result = await makeJsonRpcCall<number>(auth, 'setBookingComment', params);

    return { id: result };
  }
});
