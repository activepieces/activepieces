import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listTopStoriesAction = createAction({
	name: 'hackernews_list_top_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List Top Stories',
	description: 'Lists the stories on the Hacker News front page, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the current Hacker News front-page ranking (up to 500 ranked stories, including job posts), with full details for the first `limit` stories (default 10, max 100). Use for "what is trending on Hacker News now". Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'top', limit: propsValue.limit });
	},
});
