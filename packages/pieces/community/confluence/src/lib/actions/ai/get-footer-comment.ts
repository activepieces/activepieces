import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetFooterCommentOutputSchema } from '../../output-schemas';

export const getFooterCommentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_footer_comment',
	outputSchema: confluenceGetFooterCommentOutputSchema,
	displayName: 'Get Footer Comment',
	description: 'Gets a footer comment by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence footer comment by ID, with its body, version and the page, blog post or parent comment it belongs to.',
		idempotent: true,
	},
	props: {
		commentId: confluenceAiProps.commentId({ required: true }),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'Body representation to return. Defaults to storage (XHTML).',
			required: false,
			defaultValue: 'storage',
			options: {
				disabled: false,
				options: [
					{ label: 'Storage (XHTML)', value: 'storage' },
					{ label: 'Atlas Document Format', value: 'atlas_doc_format' },
					{ label: 'View (rendered HTML)', value: 'view' },
				],
			},
		}),
	},
	async run(context) {
		const { commentId, bodyFormat } = context.propsValue;
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'footer-comments',
			contentId: commentId,
			query: { 'body-format': bodyFormat ?? 'storage' },
		});
	},
});
