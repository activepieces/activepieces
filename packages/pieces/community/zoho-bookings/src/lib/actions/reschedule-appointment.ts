import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  bookingIdDropdown,
  formatDateTime,
  zohoBookingsAuth,
  zohoBookingsCommon,
} from '../common';
import { access } from 'fs';

export const rescheduleAppointment = createAction({
  auth: zohoBookingsAuth,
  name: 'rescheduleAppointment',
  displayName: 'Reschedule Appointment',
  description:
    'Reschedule an appointment to a different time or to a different staff',
  props: {
    from_time: Property.DateTime({
      displayName: 'From Time',
      description:
        'Start of the date range used to fetch existing bookings (to help you select the Booking ID to reschedule). Not sent to the reschedule API. Format: dd-MMM-yyyy HH:mm:ss',
      required: true,
    }),
    to_time: Property.DateTime({
      displayName: 'To Time',
      description:
        'End of the date range used to fetch existing bookings (optional). Not sent to the reschedule API. Format: dd-MMM-yyyy HH:mm:ss',
      required: false,
    }),
    booking_id: bookingIdDropdown,
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
      description:
        'Select the staff to reschedule to (use this OR group_id OR start_time)',
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
      description:
        'The unique ID of the staff group to reschedule to (use this OR staff_id OR start_time)',
      required: false,
    }),
    start_time: Property.DateTime({
      displayName: 'New Start Time',
      description:
        'The new time to reschedule the appointment to (format: dd-MMM-yyyy HH:mm:ss, use this OR staff_id OR group_id)',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const location = auth.props?.['location'] || 'zoho.com';

    // Validate props using Zod schema
    await propsValidation.validateZod(
      propsValue,
      zohoBookingsCommon.rescheduleAppointmentSchema
    );

    // Validate that at least one of staff_id, group_id, or start_time is provided
    if (
      !propsValue.staff_id &&
      !propsValue.group_id &&
      !propsValue.start_time
    ) {
      throw new Error(
        'Either staff_id, group_id, or start_time must be provided'
      );
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('booking_id', propsValue.booking_id as string);

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
        contentType: 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    console.log(auth.access_token)
    const responseBody = response.body.response;
    if (responseBody.status !== 'success') {
      throw new Error(
        `Failed to reschedule appointment: ${responseBody.message || 'Unknown error'}`
      );
    }
    if (responseBody.returnvalue.Status == "failure") {
      throw new Error(responseBody.returnvalue.message || 'Failed to reschedule appointment');
    }
    return responseBody;
  },
});
