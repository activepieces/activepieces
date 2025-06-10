import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../../index';
import { acuityschedulingAuth } from '../../index';

export const findClientByNameAction = createAction({
	auth: acuityschedulingAuth,
	name: 'findClientByName',
	displayName: 'Find Client by Name',
	description: 'Finds a client by name.',
	props: {
		first_name: Property.ShortText({
			displayName: 'Name',
			description: "Provide user\'s first name to search.",
			required: true,
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			description: 'Provide user\'s last name to search.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { first_name, last_name } = propsValue;

		const response = await httpClient.sendRequest<{
			status: string;
			data: Array<Record<string, any>>;
		}>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/clients`,
			queryParams: {
				first_name: first_name,
				last_name: last_name,
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.apiKey && auth.userId,
			},
		});

		return {
			found: response.body.status === 'success' && response.body.data.length > 0,
			result: response.body.data,
		};
	},
});