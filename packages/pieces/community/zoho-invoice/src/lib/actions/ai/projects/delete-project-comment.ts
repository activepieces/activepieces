import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteProjectCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_project_comment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Project Comment',
	description: 'Deletes a comment from a project.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one comment from a project. Use List Projects for the project ID and List Project Comments for the comment ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Project Comments to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteProjectComment({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			commentId: propsValue.commentId,
		});
	},
});
