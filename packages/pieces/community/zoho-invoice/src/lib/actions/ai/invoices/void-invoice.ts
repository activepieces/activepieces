import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const voidInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_void_invoice',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Void Invoice',
	description: 'Marks an invoice as void.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Voids an invoice so it no longer counts towards receivables; the record is kept and can be returned to draft with Mark Invoice as Draft. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.voidInvoice({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
