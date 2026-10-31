import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetCommentThreadOutputSchema } from '../../../output-schemas';

export const getCommentThreadAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_comment_thread',
	outputSchema: webflowGetCommentThreadOutputSchema,
	displayName: 'Get Comment Thread',
	description: 'Gets one comment thread on a site.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Designer comment thread by id, with its page, content, author and resolved state. Use List Comment Replies for the replies. Get the site id from List Sites and the thread id from List Comment Threads.',
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
			description: 'Locale ID to read the thread in. Leave empty for the primary locale.',
			required: false,
		}),
	},
	async run(context) {
		const { siteId, commentThreadId, localeId } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/comments/${encodeURIComponent(commentThreadId)}`,
			query: {
				...(localeId ? { localeId } : {}),
			},
		});
	},
});
