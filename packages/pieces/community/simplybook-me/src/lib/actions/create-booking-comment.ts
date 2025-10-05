import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest, SimplyBookAuth } from '../common';

export const createBookingCommentAction = createAction({
  auth: simplyBookAuth,
  name: 'create_booking_comment',
  displayName: 'Create Booking Comment',
  description: 'Add a comment or note to a booking',
  props: {
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'ID of the booking to add a comment to',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Comment or note to add to the booking',
      required: true,
    }),
    isInternal: Property.Checkbox({
      displayName: 'Internal Comment',
      description: 'Whether this is an internal comment (not visible to client)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context: { propsValue: any; auth: SimplyBookAuth }) {
    const { bookingId, comment, isInternal } = context.propsValue;
    
    const params = {
      booking_id: bookingId,
      comment: comment,
      is_internal: isInternal || false,
    };

    return await makeApiRequest(context.auth, 'addBookingComment', params);
  },
});
