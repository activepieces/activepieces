import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateFooterCommentOutputSchema } from '../../output-schemas';

export const updateFooterCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_footer_comment',
	outputSchema: confluenceUpdateFooterCommentOutputSchema,
	displayName: 'Update Footer Comment',
	description: 'Replaces the body of a footer comment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the body of a Confluence footer comment by ID, saving it as the next version. Idempotent: sending the same body again leaves the text unchanged (the version still advances).',
		idempotent: true,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
		body: confluenceAiProps.body({
			required: true,
			description: 'New comment body; replaces the whole body.',
		}),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
	},
	async run(context) {
		const { commentId, body, bodyFormat } = context.propsValue;
		const current = await confluenceApi.getVersionedContent({
			auth: context.auth,
			contentType: 'footer-comments',
			contentId: commentId,
		});
		return await confluenceApi.updateComment({
			auth: context.auth,
			commentType: 'footer-comments',
			commentId,
			representation: bodyFormat ?? 'storage',
			value: body,
			versionNumber: current.version.number + 1,
		});
	},
});
