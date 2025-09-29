import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const getAppointmentDetails = createAction({
  auth: zohoBookingsAuth,
  name: 'getAppointmentDetails',
  displayName: 'Get Appointment Details',
  description: 'Get details of an appointment using its booking ID',
  props: {
    booking_id: Property.Dropdown({
      displayName: 'Appointment',
      description: 'Select the appointment to get details for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Authentication required',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const appointments = await zohoBookingsCommon.fetchAppointments(
            (auth as any).access_token,
            location,
            { perPage: 50 }
          );

          return {
            options: appointments.map((appointment: any) => ({
              label: `${appointment.booking_id} - ${appointment.customer_name} (${appointment.service_name}) - ${appointment.start_time} [${appointment.status}]`,
              value: appointment.booking_id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load appointments',
            options: [],
          };
        }
      },
    }),
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
        booking_id: propsValue.booking_id,
      },
    });

    return response.body;
  },
});