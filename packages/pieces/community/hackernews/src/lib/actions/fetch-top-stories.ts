import { createAction, Property } from '@activepieces/pieces-framework';

import { hackernewsApi } from '../common/api';
import { fetchTopStoriesOutputSchema } from '../output-schemas';

export const fetchTopStoriesAction = createAction({
	name: 'fetch_top_stories',
	outputSchema: fetchTopStoriesOutputSchema,
	classification: 'SEARCH',
	displayName: 'Fetch Top Stories',
	description: 'Get the current top stories on Hacker News.',
	audience: 'human',
	aiMetadata: {
		description:
			'Retrieves the current top stories from Hacker News, returning the first N stories (N set by the number-of-stories input) with their full item details. Use to surface or summarize what is trending on Hacker News right now. Read-only and idempotent; a larger N simply fetches more of the same ranked list.',
		idempotent: true,
	},
	props: {
		number_of_stories: Property.Number({
			displayName: 'Number of Stories',
			description: 'How many stories to return, from the top (up to 500).',
			required: true,
			defaultValue: 10,
		}),
	},
	async run({ propsValue }) {
		return await hackernewsApi.listTopStories({ limit: propsValue.number_of_stories });
	},
});
