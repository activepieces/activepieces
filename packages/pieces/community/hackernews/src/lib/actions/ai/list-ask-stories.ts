import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listAskStoriesAction = createAction({
	name: 'hackernews_list_ask_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List Ask Stories',
	description: 'Lists the latest Ask HN posts, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the latest Ask HN posts (up to 200), with full details for the first `limit` stories (default 10, max 100). Use for community questions; the question body is in text. Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'ask', limit: propsValue.limit });
	},
});
