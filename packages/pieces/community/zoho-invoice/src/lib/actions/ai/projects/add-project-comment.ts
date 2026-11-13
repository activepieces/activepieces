import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceAddProjectCommentOutputSchema } from '../../../output-schemas';

export const addProjectCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_add_project_comment',
	outputSchema: zohoInvoiceAddProjectCommentOutputSchema,
	displayName: 'Add Project Comment',
	description: 'Adds a comment to a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a comment to a project. Use List Projects to find the project ID. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Text of the comment.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.addProjectComment({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			body: { description: propsValue.comment },
		});
	},
});
