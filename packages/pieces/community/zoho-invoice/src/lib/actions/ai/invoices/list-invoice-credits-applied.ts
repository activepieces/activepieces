import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListInvoiceCreditsAppliedOutputSchema } from '../../../output-schemas';

export const listInvoiceCreditsAppliedAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_invoice_credits_applied',
	outputSchema: zohoInvoiceListInvoiceCreditsAppliedOutputSchema,
	displayName: 'List Invoice Credits Applied',
	description: 'Lists the credit notes applied to an invoice.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the credit notes applied to an invoice with the credit note and amount applied. Use Apply Credits to Invoice to add more. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listInvoiceCreditsApplied({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
