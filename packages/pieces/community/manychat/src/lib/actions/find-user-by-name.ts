import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/props';
import { manychatAuth } from '../../index';

export const findUserByNameAction = createAction({
	auth: manychatAuth,
	name: 'findUserByName',
	displayName: 'Find User by Name',
	description: 'Finds a user by name.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: "Provide user's full name to search.",
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { name } = propsValue;

		const response = await httpClient.sendRequest<{
			status: string;
			data: Array<Record<string, any>>;
		}>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/subscriber/findByName`,
			queryParams: {
				name: name,
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
