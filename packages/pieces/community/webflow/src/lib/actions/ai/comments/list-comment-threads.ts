import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowListCommentThreadsOutputSchema } from '../../../output-schemas';

export const listCommentThreadsAction = createAction({
	auth: webflowAuth,
	name: 'webflow_list_comment_threads',
	outputSchema: webflowListCommentThreadsOutputSchema,
	displayName: 'List Comment Threads',
	description: 'Lists the comment threads on a site.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the Designer comment threads on a site with each thread's id, page, content and resolved state. Pages with limit and offset. Get the site id from List Sites.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(context.propsValue.siteId)}/comments`,
			query: {
				limit: String(context.propsValue.limit ?? 100),
				offset: String(context.propsValue.offset ?? 0),
			},
		});
	},
});
