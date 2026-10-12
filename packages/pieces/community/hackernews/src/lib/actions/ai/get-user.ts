import { createAction, Property } from '@activepieces/pieces-framework';

import { hackernewsApi } from '../../common/api';
import { hackernewsGetUserOutputSchema } from '../../output-schemas';

export const getUserAction = createAction({
	name: 'hackernews_get_user',
	outputSchema: hackernewsGetUserOutputSchema,
	displayName: 'Get User',
	description: 'Gets a Hacker News user profile by username.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches a Hacker News user profile: karma, about text, signup date and their most recent submission ids (up to 100, newest first, with the full count). Usernames are case-sensitive and come from the author field of an item. Only users with public activity exist.',
		idempotent: true,
	},
	props: {
		username: Property.ShortText({
			displayName: 'Username',
			description: 'The case-sensitive Hacker News username, e.g. "pg".',
			required: true,
		}),
	},
	async run({ propsValue }) {
		return await hackernewsApi.getUser({ username: propsValue.username });
	},
});
