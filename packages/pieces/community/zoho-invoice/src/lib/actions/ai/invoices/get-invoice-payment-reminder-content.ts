import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetInvoicePaymentReminderContentOutputSchema } from '../../../output-schemas';

export const getInvoicePaymentReminderContentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_invoice_payment_reminder_content',
	outputSchema: zohoInvoiceGetInvoicePaymentReminderContentOutputSchema,
	displayName: 'Get Invoice Payment Reminder Content',
	description: 'Gets the default payment reminder email for an invoice.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the default subject, body and recipients Zoho Invoice would use for a payment reminder on this invoice, without sending anything. Use it to prepare Send Invoice Payment Reminder. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getInvoicePaymentReminderContent({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
