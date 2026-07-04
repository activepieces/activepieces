import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const findUserByIdAction = createAction({
	auth: slackAuth,
	name: 'find-user-by-id',
	displayName: 'Find User by ID',
	description: 'Finds a user by their ID.',
	audience: 'both',
	aiMetadata: { description: 'Fetch a user profile directly by their Slack user ID; read-only and repeatable. Pick this when you already have the user ID (the fastest, exact lookup); use Find User by Handle when you only know the display-name handle.', idempotent: true },
	props: {
		id: Property.ShortText({
			displayName: 'ID',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const client = new WebClient(getBotToken(auth as SlackAuthValue));
		return await client.users.profile.get({
			user: propsValue.id,
		});
	},
});
