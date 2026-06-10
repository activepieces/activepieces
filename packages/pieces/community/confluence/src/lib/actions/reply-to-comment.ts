import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';

export const replyToCommentAction = createAction({
	auth: confluenceAuth,
	name: 'reply-to-comment',
	displayName: 'Reply to Comment',
	description: 'Replies to an existing footer comment on a page.',
	audience: 'both',
	aiMetadata: { description: 'Posts a reply nested under an existing footer comment, identified by the parent comment ID, with the reply body in storage (XHTML) format. Use to respond in a comment thread; to start a new top-level comment use Add Comment to Page instead. Not idempotent: each call adds another reply.', idempotent: false },
	props: {
		parentCommentId: Property.ShortText({
			displayName: 'Parent Comment ID',
			description: 'The ID of the comment to reply to.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Reply',
			description: 'Reply body in storage (XHTML) format.',
			required: true,
		}),
	},
	async run(context) {
		const { parentCommentId, body } = context.propsValue;

		return await confluenceApiCall({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.POST,
			version: 'v2',
			resourceUri: '/footer-comments',
			body: {
				parentCommentId,
				body: {
					representation: 'storage',
					value: body,
				},
			},
		});
	},
});
