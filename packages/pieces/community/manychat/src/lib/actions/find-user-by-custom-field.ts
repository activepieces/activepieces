import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/props';
import { manychatAuth } from '../../index';

export const findUserByCustomFieldAction = createAction({
	auth: manychatAuth,
	name: 'findUserByCustomField',
	displayName: 'Find User by Custom Field',
	description: 'Finds a user by custom field.',
	props: {
		field: Property.Dropdown({
	displayName: 'Custom Field',
	refreshers: [],
	required: true,
	options: async ({ auth }) => {
		if (!auth) {
			return {
				placeholder: 'Please connect your account.',
				disabled: true,
				options: [],
			};
		}

		const response = await httpClient.sendRequest<{
			data: Array<{ id: number; name: string; type: string }>;
		}>({
			url: `${BASE_URL}/page/getCustomFields`,
			method: HttpMethod.GET,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth as string,
			},
		});
		return {
			disabled: false,
			options: response.body.data
				.filter((field) => ['text', 'number'].includes(field.type))
				.map((field) => ({
					label: field.name,
					value: field.id,
				})),
		};
	},
}),
		value: Property.ShortText({
			displayName: 'Value',
			description: 'The value to search for.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { field, value } = propsValue;

		const response = await httpClient.sendRequest<{
			status: string;
			data: Array<Record<string, any>>;
		}>({
			method: HttpMethod.GET,
			url: `${BASE_URL}/subscriber/findByCustomField`,
			queryParams: {
				field_id: field.toString(),
				field_value: value,
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
