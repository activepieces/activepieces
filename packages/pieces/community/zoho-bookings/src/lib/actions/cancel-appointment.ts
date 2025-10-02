import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bookingIdDropdown, zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const cancelAppointment = createAction({
  auth: zohoBookingsAuth,
  name: 'cancelAppointment',
  displayName: 'Cancel Appointment',
  description:
    'Update the status of a booking (cancel, complete, or mark as no-show)',
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'The starting time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'The ending time for the appointment (format: mm-dd-yyyy HH:mm:ss)',
      required: false,
    }),
    booking_id: bookingIdDropdown,
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(
      propsValue,
      zohoBookingsCommon.cancelAppointmentSchema
    );

    // Prepare form data
    const formData = new FormData();
    formData.append('booking_id', propsValue.booking_id as string);
    formData.append('action', 'cancel');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoBookingsCommon.baseUrl(location)}/updateappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
        contentType: 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    return response.body;
  },
});
