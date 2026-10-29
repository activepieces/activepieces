import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceInvoiceOutputSchema } from '../../../output-schemas';

export const getInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_invoice',
	outputSchema: zohoInvoiceInvoiceOutputSchema,
	displayName: 'Get Invoice',
	description: 'Gets one invoice by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one invoice by ID with its customer, dates, status, totals, balance and line items. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getInvoice({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
