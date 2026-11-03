import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteFooterCommentOutputSchema } from '../../output-schemas';

export const deleteInlineCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_inline_comment',
	outputSchema: confluenceDeleteFooterCommentOutputSchema,
	displayName: 'Delete Inline Comment',
	description: 'Permanently deletes a inline comment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a Confluence inline comment by ID. Cannot be undone. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
	},
	async run(context) {
		const { commentId } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'inline-comments',
			contentId: commentId,
		});
		return { deleted: true, commentId };
	},
});
