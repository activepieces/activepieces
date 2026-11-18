import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const cancelInvoiceWriteOffAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_cancel_invoice_write_off',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Cancel Invoice Write Off',
	description: 'Cancels the write off of an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reverses Write Off Invoice so the balance is due again. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.cancelInvoiceWriteOff({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
