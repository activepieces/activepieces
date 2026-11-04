import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCommentRepliesOutputSchema } from '../../../output-schemas';

export const listCommentRepliesAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_comment_replies',
	outputSchema: webflowListCommentRepliesOutputSchema,
	displayName: 'List Comment Replies',
	description: 'Lists the replies in a comment thread.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the replies in a Designer comment thread with each reply's id, content, author and timestamps. Pages with limit and offset. Get the site id from List Sites and the thread id from List Comment Threads.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		commentThreadId: Property.ShortText({
			displayName: 'Comment Thread ID',
			description: 'Comment thread ID. Use List Comment Threads to find it.',
			required: true,
		}),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to read the replies in. Leave empty for the primary locale.',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by. Needs Sort Order.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Created On', value: 'createdOn' },
					{ label: 'Last Updated', value: 'lastUpdated' },
				],
			},
		}),
		sortOrder: Property.StaticDropdown({
			displayName: 'Sort Order',
			description: 'Sort direction.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Ascending', value: 'asc' },
					{ label: 'Descending', value: 'desc' },
				],
			},
		}),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		const { siteId, commentThreadId, localeId, sortBy, sortOrder, limit, offset } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/comments/${encodeURIComponent(commentThreadId)}/replies`,
			query: {
				limit: String(limit ?? 100),
				offset: String(offset ?? 0),
				...(localeId ? { localeId } : {}),
				...(sortBy ? { sortBy } : {}),
				...(sortOrder ? { sortOrder } : {}),
			},
		});
	},
});
