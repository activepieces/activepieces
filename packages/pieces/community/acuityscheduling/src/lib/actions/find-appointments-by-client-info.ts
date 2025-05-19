import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';
import { acuityschedulingAuth } from '../../index';

export const findAppointmentByClientInfoAction = createAction({
	auth: acuityschedulingAuth,
	name: 'findAppointmentByClientInfo',
	displayName: 'Find Appointment by User Info',
	description: 'Finds apponintment by user info.',
	props: {
    search_field: Property.StaticDropdown({
      displayName: 'Search Field',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'First Name', value: 'first_name'},
          { label: 'Last Name', value: 'last_name' },
        ]
      }
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
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
		const { search_field, search_value} = propsValue;

		const response = await httpClient.sendRequest<{
			status: string;
			data: Array<Record<string, any>>;
		}>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/appointment/findByUserInfo`,
			queryParams: {
				field_id: search_field.toString(),
				field_value: search_value,
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
		});

		return {
			found: response.body.status === 'success' && response.body.data.length > 0,
			result: response.body.data,
		};
	},
});