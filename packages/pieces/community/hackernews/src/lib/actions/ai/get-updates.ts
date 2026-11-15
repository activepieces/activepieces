import { createAction } from '@activepieces/pieces-framework';

import { hackernewsApi } from '../../common/api';
import { hackernewsGetUpdatesOutputSchema } from '../../output-schemas';

export const getUpdatesAction = createAction({
	name: 'hackernews_get_updates',
	outputSchema: hackernewsGetUpdatesOutputSchema,
	displayName: 'Get Updates',
	description: 'Gets the items and user profiles that changed recently on Hacker News.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the ids of recently changed items and the usernames of recently changed profiles on Hacker News. Use it to monitor activity; pass the ids to Get Item and the usernames to Get User for details.',
		idempotent: true,
	},
	props: {},
	async run() {
		return await hackernewsApi.getUpdates();
	},
});
