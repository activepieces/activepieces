import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookingIdDropdown, zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const getAppointmentDetails = createAction({
  auth: zohoBookingsAuth,
  name: 'getAppointmentDetails',
  displayName: 'Get Appointment Details',
  description: 'Get details of an appointment using its booking ID',
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description: 'The start time of the appointment (in ISO 8601 format)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description: 'The end time of the appointment (in ISO 8601 format)',
      required: false,
    }),
    booking_id: bookingIdDropdown
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(propsValue, zohoBookingsCommon.getAppointmentDetailsSchema);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoBookingsCommon.baseUrl(location)}/getappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
        
      },
      queryParams: {
        booking_id: propsValue.booking_id as string,
      },
    });

    return response.body;
  },
});