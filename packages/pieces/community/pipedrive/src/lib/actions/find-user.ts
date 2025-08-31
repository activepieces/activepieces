import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserAction = createAction({
	auth: pipedriveAuth,
	name: 'find-user',
	displayName: 'Find User',
	description: 'Finds a user by name or email.',
	props: {
		field: Property.StaticDropdown({
			displayName: 'Field to search by',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Name',
						value: 'name',
					},
					{
						label: 'Email',
						value: 'email',
					},
				],
			},
		}),
		fieldValue: Property.ShortText({
			displayName: 'Field Value',
			required: true,
		}),
	},
	async run(context) {
		const { field, fieldValue } = context.propsValue;

		const response = await pipedriveApiCall<{ success: boolean; data: Array<Record<string, any>> }>(
			{
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/v1/users/find',
				query: {
					term: fieldValue,
					search_by_email: field == 'email' ? 1 : 0,
				},
			},
		);

		return {
			found: response.data && response.data.length > 0, 
			data: response.data,
		};
	},
});
