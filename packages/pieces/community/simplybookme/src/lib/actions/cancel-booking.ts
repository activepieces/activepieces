import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const cancelBooking = createAction({
  auth: simplybookAuth,
  name: 'cancel_booking',
  displayName: 'Cancel Booking',
  description: 'Cancel an existing booking',
  props: {
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'The ID of the booking to cancel',
      required: true
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const { bookingId } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://user-api-v2.simplybook.me/admin/bookings/${bookingId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to cancel booking: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  }
});
