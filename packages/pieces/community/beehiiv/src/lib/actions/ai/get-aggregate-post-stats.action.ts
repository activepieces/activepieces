import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { BeehiivApiError, apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiPostFilters, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const getAggregatePostStatsAiAction = createAction({
	auth: beehiivAuth,
	name: 'get_aggregate_post_stats',
	classification: 'READ',
	displayName: 'Get Aggregate Post Stats',
	description: 'Gets combined email and web stats across the posts of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets combined email (recipients, opens, clicks, unsubscribes) and web (views, clicks) stats summed over all beehiiv posts that match the filters. Use it for totals; use "Get Post" with stats for one post. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.aggregatePostStats,
	props: {
		publication_id: aiProps.publicationId(),
		...aiPostFilters.props(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const response = await beehiivClient
			.request({
				apiKey: apiKeyOf(auth),
				method: 'GET',
				path: `${pathFor(['publications', publicationId, 'posts'])}/aggregate_stats`,
				operation: 'get aggregate post stats',
				query: aiPostFilters.query({ propsValue }),
				retryPending: true,
			})
			.catch((error: unknown) => {
				if (isNoPostsError(error)) {
					throw new Error(NO_POSTS_MESSAGE);
				}
				throw error;
			});
		return aiInput.dataOf(response.body);
	},
});

function isNoPostsError(error: unknown): boolean {
	return error instanceof BeehiivApiError && error.status === 500 && error.code === 'NO_METHOD';
}

const NO_POSTS_MESSAGE =
	'beehiiv could not compute post stats (HTTP 500, NO_METHOD). This happens when the publication has no posts yet, or when the filters match no posts. Check "List Posts" before retrying.';
