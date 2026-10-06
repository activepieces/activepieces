import { createAction } from '@activepieces/pieces-framework';

import { hackernewsAiProps } from '../../common/ai-props';
import { hackernewsApi } from '../../common/api';
import { hackernewsListStoriesOutputSchema } from '../../output-schemas';

export const listJobStoriesAction = createAction({
	name: 'hackernews_list_job_stories',
	outputSchema: hackernewsListStoriesOutputSchema,
	displayName: 'List Job Stories',
	description: 'Lists the latest Hacker News job posts, with full details.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the latest job posts from YC companies (up to 200), with full details for the first `limit` stories (default 10, max 100). Use to find hiring posts; most have a url or a text body, not comments. Use Get Item with a story id from here to read a single story again later.',
		idempotent: true,
	},
	props: {
		limit: hackernewsAiProps.limit({ required: false }),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listStories({ storyList: 'job', limit: propsValue.limit });
	},
});
