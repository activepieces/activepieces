import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const markInvoiceDraftAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_invoice_draft',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Mark Invoice as Draft',
	description: 'Reverts a sent or void invoice to draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a sent or voided invoice back to Draft status. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markInvoiceDraft({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
