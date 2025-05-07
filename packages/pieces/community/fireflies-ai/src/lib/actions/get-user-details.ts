import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { firefliesAiAuth } from '../../index';

export const getUserDetailsAction = createAction({
	auth: firefliesAiAuth,
	name: 'get_user_details',
	displayName: 'Get User Details',
	description: 'Fetch profile information of a Fireflies user',
	props: {
		email: Property.ShortText({
			displayName: 'User Email',
			description: 'Email of the user to fetch details for (defaults to authenticated user if not provided)',
			required: false,
		}),
	},
	async run({ propsValue, auth }) {
		const query = propsValue.email
			? `
				query getUserByEmail($email: String!) {
					user(email: $email) {
						id
						name
						email
						role
						organization {
							id
							name
						}
						settings {
							timezone
							language
						}
					}
				}
			`
			: `
				query getMyProfile {
					me {
						id
						name
						email
						role
						organization {
							id
							name
						}
						settings {
							timezone
							language
						}
					}
				}
			`;

		const variables = propsValue.email ? { email: propsValue.email } : undefined;

		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			variables,
		);

		return propsValue.email ? response.data.user : response.data.me;
	},
});
