import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteFooterCommentOutputSchema } from '../../output-schemas';

export const deleteFooterCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_footer_comment',
	outputSchema: confluenceDeleteFooterCommentOutputSchema,
	displayName: 'Delete Footer Comment',
	description: 'Permanently deletes a footer comment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a Confluence footer comment by ID. Cannot be undone. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
	},
	async run(context) {
		const { commentId } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'footer-comments',
			contentId: commentId,
		});
		return { deleted: true, commentId };
	},
});
