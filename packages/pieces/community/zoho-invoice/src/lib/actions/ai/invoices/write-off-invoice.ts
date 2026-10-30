import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const writeOffInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_write_off_invoice',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Write Off Invoice',
	description: 'Writes off the unpaid balance of an invoice.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Writes off the remaining balance of an unpaid invoice as uncollectible. Reverse it with Cancel Invoice Write Off. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.writeOffInvoice({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
