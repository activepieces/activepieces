import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetCommentThreadOutputSchema } from '../../../output-schemas';

export const resolveCommentThreadAction = createAction({
	auth: webflowAuth,
	name: 'webflow_resolve_comment_thread',
	outputSchema: webflowGetCommentThreadOutputSchema,
	displayName: 'Resolve Comment Thread',
	description: 'Resolves or reopens a comment thread on a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets a Designer comment thread to resolved ("true") or reopens it ("false"). Get the site id from List Sites and the thread id from List Comment Threads.',
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		commentThreadId: Property.ShortText({
			displayName: 'Comment Thread ID',
			description: 'Comment thread ID. Use List Comment Threads to find it.',
			required: true,
		}),
		resolved: webflowAiProps.flag({
			required: true,
			displayName: 'Resolved',
			description: '"true" resolves the thread, "false" reopens it.',
		}),
	},
	async run(context) {
		const { siteId, commentThreadId, resolved } = context.propsValue;
		if (resolved !== 'true' && resolved !== 'false') {
			throw new Error('resolved must be "true" or "false".');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/sites/${encodeURIComponent(siteId)}/comments/${encodeURIComponent(commentThreadId)}`,
			body: { resolved: resolved === 'true' },
		});
	},
});
