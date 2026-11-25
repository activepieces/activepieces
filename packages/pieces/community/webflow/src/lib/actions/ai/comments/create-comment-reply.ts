import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCommentReplyOutputSchema } from '../../../output-schemas';

export const createCommentReplyAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_comment_reply',
	outputSchema: webflowCreateCommentReplyOutputSchema,
	displayName: 'Create Comment Reply',
	description: 'Replies to a comment thread.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a reply to a Designer comment thread; each call adds another reply. Mention a user with [[userId]] in the content. Get the site id from List Sites and the thread id from List Comment Threads.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		commentThreadId: Property.ShortText({
			displayName: 'Comment Thread ID',
			description: 'Comment thread ID. Use List Comment Threads to find it.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Reply text, up to 2040 characters. To @mention a user, include their user ID as [[userId]].',
			required: true,
		}),
	},
	async run(context) {
		const { siteId, commentThreadId, content } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/comments/${encodeURIComponent(commentThreadId)}/replies`,
			body: { content },
		});
	},
});
