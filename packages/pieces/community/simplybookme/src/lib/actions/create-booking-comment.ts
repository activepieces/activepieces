import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const createBookingComment = createAction({
  auth: simplybookAuth,
  name: 'create_booking_comment',
  displayName: 'Create Booking Comment',
  description: 'Add a comment or note to a booking',
  props: {
    bookingId: Property.Number({
      displayName: 'Booking ID',
      description: 'The ID of the booking to add a comment to',
      required: true
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The comment or note to add to the booking',
      required: true
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const { bookingId, comment } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `https://user-api-v2.simplybook.me/admin/bookings/${bookingId}/comment`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        },
        body: {
          comment
        }
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to add booking comment: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to add booking comment: ${error.message}`);
    }
  }
});
