import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetInvoiceEmailContentOutputSchema } from '../../../output-schemas';

export const getInvoiceEmailContentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_invoice_email_content',
	outputSchema: zohoInvoiceGetInvoiceEmailContentOutputSchema,
	displayName: 'Get Invoice Email Content',
	description: 'Gets the default email Zoho would send for an invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the default subject, body, recipients and sender Zoho Invoice would use to email this invoice, without sending anything. Use it to prepare Email Invoice. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getInvoiceEmailContent({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
