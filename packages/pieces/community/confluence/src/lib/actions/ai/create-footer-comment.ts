import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateFooterCommentOutputSchema } from '../../output-schemas';

export const createFooterCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_footer_comment',
	outputSchema: confluenceCreateFooterCommentOutputSchema,
	displayName: 'Create Footer Comment',
	description: 'Adds a footer comment to a page, blog post or attachment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a top-level footer comment to a Confluence page, blog post or attachment; set exactly one of their IDs. To reply to an existing footer comment use Reply to Comment, and for comments on highlighted text use Create Inline Comment. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		pageId: confluenceAiProps.pageId({
			required: false,
			description: 'Page to comment on, from List Pages.',
		}),
		blogPostId: confluenceAiProps.blogPostId({
			required: false,
			description: 'Blog post to comment on, from List Blog Posts.',
		}),
		attachmentId: confluenceAiProps.attachmentId({
			required: false,
			description: 'Attachment to comment on.',
		}),
		body: confluenceAiProps.body({ required: true }),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
	},
	async run(context) {
		const { pageId, blogPostId, attachmentId, body, bodyFormat } = context.propsValue;
		if ([pageId, blogPostId, attachmentId].filter((id) => id !== undefined).length !== 1) {
			throw new Error('Set exactly one of Page ID, Blog Post ID or Attachment ID.');
		}
		return await confluenceApi.createFooterCommentOn({
			auth: context.auth,
			pageId,
			blogPostId,
			attachmentId,
			representation: bodyFormat ?? 'storage',
			value: body,
		});
	},
});
