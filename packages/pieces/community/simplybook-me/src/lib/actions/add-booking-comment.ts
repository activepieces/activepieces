import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, createDropdownOptions } from '../common';

export const addBookingComment = createAction({
  auth: simplybookAuth,
  name: 'add_booking_comment',
  displayName: 'Add Booking Comment',
  description: 'Add a comment to an existing booking',
  props: {
    bookingId: Property.Dropdown({
      displayName: 'Booking',
      description: 'Select the booking to comment on',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.bookings(auth),
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text to add',
      required: true,
    }),
  },
  async run(context) {
    const { bookingId, comment } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const result = await client.addBookingComment(bookingId, comment);
      return {
        success: true,
        comment: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
