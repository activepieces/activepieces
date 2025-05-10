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
			displayName: 'User ID',
			description: 'ID of the user to fetch details for (defaults to authenticated user if not provided)',
			required: false,
		}),
	},
	async run({ propsValue, auth }) {
		const query = `
			query User($userId: String) {
				user(id: $userId) {
					user_id
					name
					recent_transcript
					recent_meeting
					num_transcripts
					minutes_consumed
					is_admin
				}
			}
		`;

		const variables = { userId: propsValue.email || null };

		const response = await makeRequest(
			auth as string,
			HttpMethod.POST,
			query,
			variables,
		);

		return response.data.user;
	},
});
