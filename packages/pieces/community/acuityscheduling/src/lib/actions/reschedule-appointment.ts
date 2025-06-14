import { createAction, Property } from '@activepieces/pieces-framework';
import { acuityschedulingAuth } from '../../index';
import { createClient } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';

export const rescheduleAppointmentAction = createAction({
  auth: acuityschedulingAuth,
  name: 'reschedule_appointment',
  displayName: 'Reschedule Appointment',
  description: 'Reschedule an existing appointment',
  props: {
    appointment_id: Property.Dropdown({
      displayName: 'Appointment',
      description: 'Select the appointment to reschedule',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        const authData = auth as { userId: string | number, apiKey: string };

        try {
          const response = await httpClient.sendRequest<{
            status: string;
            data: Array<{ id: string | number, calendar: string, datetime: string }>;
          }>({
            method: HttpMethod.GET,
            url: `${BASE_URL}/appointments`,
            authentication: {
              type: AuthenticationType.BASIC,
              username: authData.userId.toString(),
              password: authData.apiKey,
            },
            queryParams: {
              max: '10' // Limit to 10 most recent appointments
            }
          });

          if (response.body.status === 'success') {
            return {
              disabled: false,
              options: response.body.data.map(appointment => ({
                label: `${appointment.calendar} - ${new Date(appointment.datetime).toLocaleString()}`,
                value: appointment.id.toString()
              }))
            };
          }
          return {
            disabled: true,
            options: [],
            placeholder: 'No appointments found'
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not fetch appointments. Check your authentication.'
          };
        }
      }
    }),
    new_start_time: Property.DateTime({
      displayName: 'New Start Time',
      description: 'The new start time for the appointment',
      required: true,
    }),
    send_notifications: Property.Checkbox({
      displayName: 'Send Notifications',
      description: 'Whether to send rescheduling notifications to participants',
      required: false,
      defaultValue: true,
    }),
    Notes: Property.LongText({
      displayName: 'NOtes',
      description: 'Optional notes for rescheduling',
      required: false,
    }),
  },
  async run({auth , propsValue}) {
    const { 
      appointment_id, 
      new_start_time, 
    } = propsValue;

    const response = await httpClient.sendRequest<{
      status: string;
      data: Array<Record<string, any>>;
    }>({
      method: HttpMethod.PUT,
      url: `${BASE_URL}/appointments/${appointment_id}/reschedule`,
      queryParams: {
        new_start_time: new_start_time,
        appointment_id: appointment_id, 
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.userId.toString(),
        password: auth.apiKey,
      },
    });
    
    return {
      found: response.body.status === 'success' && response.body.data.length > 0,
      result: response.body.data,
    };
  },
});