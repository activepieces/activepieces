import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';

export const findClientAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'find_client',
	displayName: 'Find Client',
	description: 'Finds client based on seach term.',
	props: {
		search: Property.ShortText({
			displayName: 'Search Term',
			description: 'Filter client list by first name, last name, or phone number.',
			required: true,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const queryParams: Record<string, string> = {};
		if (props.search) {
			queryParams['search'] = props.search;
		}

		const response = await httpClient.sendRequest<Array<Record<string, any>>>({
			method: HttpMethod.GET,
			url: `${API_URL}/clients`,
			queryParams,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return {
			found: response.body.length > 0,
			data: response.body,
		};
	},
});
