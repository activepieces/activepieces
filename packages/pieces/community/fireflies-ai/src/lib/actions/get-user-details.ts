import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firefliesAiAuth } from '../auth';
import { getUser } from '../common/queries';
import { BASE_URL } from '../common';

export const getUserDetailsAction = createAction({
	auth: firefliesAiAuth,
	name: 'get-user-details',
	classification: 'READ',
	displayName: 'Get User Details',
	description: "Gets a Fireflies user's profile by user ID.",
	audience: 'both',
	aiMetadata: { description: 'Fetches a Fireflies user profile (name, email, admin status, transcript counts, integrations) by user ID. Use when the agent needs account details for a specific user; requires the exact user ID. Read-only and idempotent.', idempotent: true },
	props: {
		userId: Property.ShortText({
			displayName: 'User ID',
			description: "Map it from an earlier step, such as a meeting's user ID.",
			required: true,
		}),
	},
	async run(context) {
		const response = await httpClient.sendRequest<{ data: { user: Record<string, any> } }>({
			url: BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.secret_text,
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
