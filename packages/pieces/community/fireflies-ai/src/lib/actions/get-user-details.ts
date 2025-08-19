import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../../index';
import { getUser } from '../common/queries';
import { BASE_URL } from '../common';

export const getUserDetailsAction = createAction({
	auth: firefliesAiAuth,
	name: 'get-user-details',
	displayName: 'Get User Details',
	description: 'Retrieves profile information by ID.',
	props: {
		userId: Property.ShortText({
			displayName: 'User ID',
			required: true,
		}),
	},
	async run(context) {
		const response = await httpClient.sendRequest<{ data: { user: Record<string, any> } }>({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth,
			},
			body: {
				query: getUser,
				variables: {
					userId: context.propsValue.userId,
				},
			},
		});

		return response.body.data.user;
	},
});
