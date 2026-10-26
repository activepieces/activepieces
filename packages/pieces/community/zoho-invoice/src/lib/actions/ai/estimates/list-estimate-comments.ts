import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListEstimateCommentsOutputSchema } from '../../../output-schemas';

export const listEstimateCommentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_estimate_comments',
	outputSchema: zohoInvoiceListEstimateCommentsOutputSchema,
	displayName: 'List Estimate Comments',
	description: 'Lists the comments and history of an estimate.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments and activity history of one estimate, with the comment_id that Update Estimate Comment and Delete Estimate Comment need. Use List Estimates to find the estimate ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listEstimateComments({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
		});
	},
});
