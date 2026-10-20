import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateInlineCommentOutputSchema } from '../../output-schemas';

export const createInlineCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_inline_comment',
	outputSchema: confluenceCreateInlineCommentOutputSchema,
	displayName: 'Create Inline Comment',
	description: 'Adds an inline comment on highlighted text, or replies to one.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an inline comment that highlights text on a Confluence page or blog post, or replies to an existing inline comment. For a new comment set Page ID or Blog Post ID plus Text Selection (text that appears in the body); for a reply set only Parent Comment ID. Not idempotent: each call adds another comment.',
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
		parentCommentId: confluenceAiProps.commentId({
			required: false,
			displayName: 'Parent Comment ID',
			description:
				'Inline comment to reply to, from List Page Inline Comments. Set only this for a reply.',
		}),
		body: confluenceAiProps.body({ required: true }),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		textSelection: Property.ShortText({
			displayName: 'Text Selection',
			description:
				'Exact text in the page body to highlight. Required for a new (non-reply) comment.',
			required: false,
		}),
		textSelectionMatchCount: Property.Number({
			displayName: 'Match Count',
			description: 'How many times Text Selection appears in the body. Defaults to 1.',
			required: false,
		}),
		textSelectionMatchIndex: Property.Number({
			displayName: 'Match Index',
			description:
				'Zero-based occurrence of Text Selection to highlight. Defaults to 0 (the first).',
			required: false,
		}),
	},
	async run(context) {
		const {
			pageId,
			blogPostId,
			parentCommentId,
			body,
			bodyFormat,
			textSelection,
			textSelectionMatchCount,
			textSelectionMatchIndex,
		} = context.propsValue;
		if ([pageId, blogPostId, parentCommentId].filter((id) => id !== undefined).length !== 1) {
			throw new Error('Set exactly one of Page ID, Blog Post ID or Parent Comment ID.');
		}
		return await confluenceApi.createInlineComment({
			auth: context.auth,
			pageId,
			blogPostId,
			parentCommentId,
			representation: bodyFormat ?? 'storage',
			value: body,
			textSelection,
			textSelectionMatchCount:
				textSelection === undefined ? undefined : textSelectionMatchCount ?? 1,
			textSelectionMatchIndex:
				textSelection === undefined ? undefined : textSelectionMatchIndex ?? 0,
		});
	},
});
