import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listNewStoriesAction = createAction({
	name: 'hackernews_list_new_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List New Stories',
	description: 'Lists the newest Hacker News stories, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the newest Hacker News stories, newest first (up to 500), with full details for the first `limit` stories (default 10, max 100). Use to see what was just submitted, before it is ranked. Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'new', limit: propsValue.limit });
	},
});
