import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const enableInvoicePaymentReminderAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_enable_invoice_payment_reminder',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Enable Invoice Payment Reminder',
	description: 'Turns on automated payment reminders for an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Turns on the organization automated payment reminders for one invoice. Reminders only go out if they are configured in the organization settings. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.enableInvoicePaymentReminder({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
