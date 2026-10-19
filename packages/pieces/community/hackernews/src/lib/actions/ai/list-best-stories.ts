import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listBestStoriesAction = createAction({
	name: 'hackernews_list_best_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List Best Stories',
	description: 'Lists the best recent Hacker News stories, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the highest-voted recent Hacker News stories (up to 500), with full details for the first `limit` stories (default 10, max 100). Use for the strongest recent stories rather than the live front page. Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'best', limit: propsValue.limit });
	},
});
