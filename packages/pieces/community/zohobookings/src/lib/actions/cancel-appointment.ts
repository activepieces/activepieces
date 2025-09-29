import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const cancelAppointment = createAction({
  auth: zohoBookingsAuth,
  name: 'cancelAppointment',
  displayName: 'Cancel Appointment',
  description: 'Update the status of a booking (cancel, complete, or mark as no-show)',
  props: {
    booking_id: Property.Dropdown({
      displayName: 'Appointment',
      description: 'Select the appointment to update',
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
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'The status of the booking that needs to be updated',
      required: true,
      options: {
        options: [
          {
            label: 'Cancel',
            value: 'cancel',
          },
          {
            label: 'Complete',
            value: 'completed',
          },
          {
            label: 'No Show',
            value: 'noshow',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(propsValue, zohoBookingsCommon.cancelAppointmentSchema);

    // Prepare form data
    const formData = new FormData();
    formData.append('booking_id', propsValue.booking_id);
    formData.append('action', propsValue.action);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoBookingsCommon.baseUrl(location)}/updateappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
      body: formData,
    });

    return response.body;
  },
});