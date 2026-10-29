import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListProjectCommentsOutputSchema } from '../../../output-schemas';

export const listProjectCommentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_project_comments',
	outputSchema: zohoInvoiceListProjectCommentsOutputSchema,
	displayName: 'List Project Comments',
	description: 'Lists the comments on a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments on one project with comment_id, text, author and date. Use List Projects to find the project ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listProjectComments({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
		});
	},
});
