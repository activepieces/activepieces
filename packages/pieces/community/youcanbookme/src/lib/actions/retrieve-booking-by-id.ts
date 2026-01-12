import { createAction, Property } from '@activepieces/pieces-framework';
import { youcanbookmeAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const retrieveBookingById = createAction({
  auth: youcanbookmeAuth,
  name: 'retrieveBookingById',
  displayName: 'Retrieve Booking by ID',
  description: 'Retrieve a booking by its ID from YouCanBookMe',
  props: {
    bookingId: Property.ShortText({
      displayName: 'Booking ID',
      description: 'The ID of the booking to retrieve',
      required: true,
    }),
    displayTimeZone: Property.ShortText({
      displayName: 'Display Time Zone',
      description: 'The time zone to display times in (e.g., America/New_York)',
      required: false,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description:
        'Comma-separated list of fields to return. Default: id,title,accountId,profileId,createdAt,startsAt,endsAt,location,tentative,timeZone,cancelled,numberOfSlots',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { bookingId, displayTimeZone, fields } = propsValue;

    const queryParams: any = {};
    if (displayTimeZone) {
      queryParams.displayTimeZone = displayTimeZone;
    }
    if (fields) {
      queryParams.fields = fields;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.youcanbook.me/v1/bookings/${bookingId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      queryParams,
    });

    return response.body;
  },
});
