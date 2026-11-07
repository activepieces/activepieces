import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListInvoiceCommentsOutputSchema } from '../../../output-schemas';

export const listInvoiceCommentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_invoice_comments',
	outputSchema: zohoInvoiceListInvoiceCommentsOutputSchema,
	displayName: 'List Invoice Comments',
	description: 'Lists the comments and history of an invoice.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments and activity history of an invoice with comment_id, author, date and text. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listInvoiceComments({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
