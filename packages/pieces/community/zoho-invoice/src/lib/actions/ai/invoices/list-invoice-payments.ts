import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListInvoicePaymentsOutputSchema } from '../../../output-schemas';

export const listInvoicePaymentsAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_invoice_payments',
	outputSchema: zohoInvoiceListInvoicePaymentsOutputSchema,
	displayName: 'List Invoice Payments',
	description: 'Lists the payments recorded against an invoice.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the payments applied to an invoice with payment_id, invoice_payment_id, date and amount. The invoice_payment_id is what Delete Invoice Payment needs. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listInvoicePayments({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
