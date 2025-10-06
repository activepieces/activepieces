import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient, createDropdownOptions } from '../common';

export const cancelBooking = createAction({
  auth: simplybookAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking in SimplyBook.me',
  props: {
    bookingId: Property.Dropdown({
      displayName: 'Booking',
      description: 'Select the booking to cancel',
      required: true,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.bookings(auth),
    }),
    reason: Property.LongText({
      displayName: 'Cancellation Reason',
      description: 'Optional reason for cancellation',
      required: false,
    }),
  },
  async run(context) {
    const { bookingId, reason } = context.propsValue;
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      await client.cancelBooking(bookingId, { reason });
      return {
        success: true,
        message: `Booking ${bookingId} cancelled successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});