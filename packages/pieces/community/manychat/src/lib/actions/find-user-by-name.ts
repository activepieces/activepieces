import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/props';
import { manychatAuth } from '../auth';

export const findUserByNameAction = createAction({
	auth: manychatAuth,
	name: 'findUserByName',
	displayName: 'Find User by Name',
	description: 'Finds a user by name.',
	audience: 'both',
	aiMetadata: { description: "Searches Manychat subscribers by full name, returning whether any matched and the list of matches. Use to resolve a contact to their subscriber record when you only know their name. Read-only and idempotent.", idempotent: true },
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
				token: auth.secret_text,
			},
		});

		return {
			found: response.body.status === 'success' && response.body.data.length > 0,
			result: response.body.data,
		};
	},
});
