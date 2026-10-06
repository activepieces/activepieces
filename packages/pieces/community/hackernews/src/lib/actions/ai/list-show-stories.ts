import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listShowStoriesAction = createAction({
	name: 'hackernews_list_show_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List Show Stories',
	description: 'Lists the latest Show HN posts, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the latest Show HN posts (up to 200), with full details for the first `limit` stories (default 10, max 100). Use for projects people are launching or demoing. Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'show', limit: propsValue.limit });
	},
});
