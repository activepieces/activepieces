import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageWithDataOutputSchema } from '../../../output-schemas';

export const markInvoiceSentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_mark_invoice_sent',
	outputSchema: zohoInvoiceMessageWithDataOutputSchema,
	displayName: 'Mark Invoice as Sent',
	description: 'Marks a draft invoice as sent without emailing it.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes a draft invoice to Sent without emailing the customer; use Email Invoice to actually send it. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.markInvoiceSent({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
