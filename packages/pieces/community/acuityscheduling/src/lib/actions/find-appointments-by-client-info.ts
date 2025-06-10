import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';
import { acuityschedulingAuth } from '../../index';

export const findAppointmentByClientInfoAction = createAction({
  auth: acuityschedulingAuth,
  name: 'findAppointmentByClientInfo',
  displayName: 'Find Appointment by User Info',
  description: 'Finds appointment by user info.',
  props: {
    appointment_id: Property.Dropdown({
      displayName: 'Appointment ID',
      description: 'Select an existing appointment or leave blank to search',
      required: false,
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
    search_field: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Field to search by when not selecting an appointment',
      required: false,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'First Name', value: 'first_name'},
          { label: 'Last Name', value: 'last_name' },
        ]
      }
    }),
    include_past: Property.Checkbox({
      displayName: 'Include Past Appointments',
      description: 'Whether to include past appointments in the search',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    })
  },
  async run({ auth, propsValue }) {
    const authData = auth as { userId: string | number, apiKey: string };
    const { appointment_id, search_field, include_past, limit } = propsValue;

    // If an appointment is selected from dropdown
    if (appointment_id) {
      const response = await httpClient.sendRequest<{
        status: string;
        data: Record<string, any>;
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/appointments/${appointment_id}`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: authData.userId.toString(), 
          password: authData.apiKey,
        },
      });

      return {
        found: response.body.status === 'success',
        result: response.body.data,
      };
    }

    // If searching by field
    if (search_field) {
      const response = await httpClient.sendRequest<{
        status: string;
        data: Array<Record<string, any>>;
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}/appointments`,
        queryParams: {
          field_id: search_field.toString(),
          include_past: include_past ? 'true' : 'false',
          max: limit?.toString() || '10'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authData.userId.toString(), 
          password: authData.apiKey,
        },
      });

      return {
        found: response.body.status === 'success' && response.body.data.length > 0,
        result: response.body.data,
      };
    }

    return {
      found: false,
      result: null,
      message: 'Please either select an appointment or provide search criteria'
    };
  },
});