import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const deleteInvoiceCommentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_delete_invoice_comment',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Delete Invoice Comment',
	description: 'Deletes a comment from an invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a comment from an invoice. Use List Invoices for the invoice ID and List Invoice Comments for the comment ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		commentId: zohoInvoiceAiProps.commentId({
			required: true,
			description: 'Comment ID. Use List Invoice Comments to find it.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.deleteInvoiceComment({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			commentId: propsValue.commentId,
		});
	},
});
