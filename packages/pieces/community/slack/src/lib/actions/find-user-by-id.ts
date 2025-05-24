import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';

export const findUserByIdAction = createAction({
	auth: slackAuth,
	name: 'find-user-by-id',
	displayName: 'Find User by ID',
	description: 'Finds a user by their ID.',
	props: {
		id: Property.ShortText({
			displayName: 'ID',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const client = new WebClient(auth.access_token);
		return await client.users.profile.get({
			user: propsValue.id,
		});
	},
});
