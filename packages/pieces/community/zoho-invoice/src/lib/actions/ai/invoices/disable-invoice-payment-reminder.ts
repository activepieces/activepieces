import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const disableInvoicePaymentReminderAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_disable_invoice_payment_reminder',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Disable Invoice Payment Reminder',
	description: 'Turns off automated payment reminders for an invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops automated payment reminders for one invoice; manual reminders can still be sent with Send Invoice Payment Reminder. Use List Invoices to find the ID.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.disableInvoicePaymentReminder({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
		});
	},
});
