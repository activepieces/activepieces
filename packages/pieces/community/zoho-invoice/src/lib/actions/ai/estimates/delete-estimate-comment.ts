import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteEstimateCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_estimate_comment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Estimate Comment',
	description: 'Deletes a comment from an estimate.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one comment from an estimate. Use List Estimates for the estimate ID and List Estimate Comments for the comment ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		estimateId: zohoInvoiceAiProps.estimateId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Estimate Comments to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteEstimateComment({
			auth,
			organizationId: propsValue.organizationId,
			estimateId: propsValue.estimateId,
			commentId: propsValue.commentId,
		});
	},
});
