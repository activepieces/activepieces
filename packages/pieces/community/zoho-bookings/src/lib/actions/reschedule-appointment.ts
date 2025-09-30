import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoBookingsAuth, zohoBookingsCommon } from '../common';

export const rescheduleAppointment = createAction({
  auth: zohoBookingsAuth,
  name: 'rescheduleAppointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedule an appointment to a different time or to a different staff',
  props: {
    booking_id: Property.Dropdown({
      displayName: 'Appointment',
      description: 'Select the appointment to reschedule',
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
            { status: 'UPCOMING', perPage: 50 }
          );

          return {
            options: appointments.map((appointment: any) => ({
              label: `${appointment.booking_id} - ${appointment.customer_name} (${appointment.service_name}) - ${appointment.start_time}`,
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
    service_id: Property.Dropdown({
      displayName: 'Service (Optional)',
      description: 'Select service to filter staff options',
      required: false,
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
          const services = await zohoBookingsCommon.fetchServices(
            (auth as any).access_token,
            location
          );

          return {
            options: services.map((service: any) => ({
              label: `${service.name} (${service.duration})`,
              value: service.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load services',
            options: [],
          };
        }
      },
    }),
    staff_id: Property.Dropdown({
      displayName: 'Staff',
      description: 'Select the staff to reschedule to (use this OR group_id OR start_time)',
      required: false,
      refreshers: ['service_id'],
      options: async ({ auth, service_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Authentication required',
            options: [],
          };
        }

        try {
          const location = (auth as any).props?.['location'] || 'zoho.com';
          const staff = await zohoBookingsCommon.fetchStaff(
            (auth as any).access_token,
            location,
            service_id as string
          );

          return {
            options: staff.map((member: any) => ({
              label: `${member.name} - ${member.designation || 'Staff'}`,
              value: member.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load staff',
            options: [],
          };
        }
      },
    }),
    group_id: Property.ShortText({
      displayName: 'Group ID',
      description: 'The unique ID of the staff group to reschedule to (use this OR staff_id OR start_time)',
      required: false,
    }),
    start_time: Property.DateTime({
      displayName: 'New Start Time',
      description: 'The new time to reschedule the appointment to (format: dd-MMM-yyyy HH:mm:ss, use this OR staff_id OR group_id)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(propsValue, zohoBookingsCommon.rescheduleAppointmentSchema);

    // Validate that at least one of staff_id, group_id, or start_time is provided
    if (!propsValue.staff_id && !propsValue.group_id && !propsValue.start_time) {
      throw new Error('Either staff_id, group_id, or start_time must be provided');
    }

    // Format datetime to the required format: dd-MMM-yyyy HH:mm:ss
    const formatDateTime = (date: string) => {
      const d = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = d.getDate().toString().padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    };

    // Prepare form data
    const formData = new FormData();
    formData.append('booking_id', propsValue.booking_id);

    // Add the reschedule parameter (only one should be provided)
    if (propsValue.staff_id) {
      formData.append('staff_id', propsValue.staff_id);
    }
    if (propsValue.group_id) {
      formData.append('group_id', propsValue.group_id);
    }
    if (propsValue.start_time) {
      formData.append('start_time', formatDateTime(propsValue.start_time));
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${zohoBookingsCommon.baseUrl(location)}/rescheduleappointment`,
      headers: {
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      },
      body: formData,
    });

    return response.body;
  },
});