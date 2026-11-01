import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceSendBulkInvoiceReminderOutputSchema } from '../../../output-schemas';

export const sendBulkInvoiceReminderAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_send_bulk_invoice_reminder',
	outputSchema: zohoInvoiceSendBulkInvoiceReminderOutputSchema,
	displayName: 'Send Bulk Invoice Reminder',
	description: 'Emails payment reminders for up to 10 invoices at once.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends real payment reminder emails for up to 10 invoices using the default reminder text; only open or overdue invoices get one. Use Send Invoice Payment Reminder to customise recipients or text for one invoice. Use List Invoices to find the IDs. Not idempotent: each call sends more emails.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceIds: Property.Array({
			displayName: 'Invoice IDs',
			description: 'IDs of the invoices to remind about (1-10). Use List Invoices to find them.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const { invoiceIds } = propsValue;
		if (
			invoiceIds.length === 0 ||
			invoiceIds.length > MAX_INVOICES ||
			!invoiceIds.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error(`Invoice IDs must be a list of 1 to ${MAX_INVOICES} invoice ID strings.`);
		}
		return await zohoInvoiceApi.sendBulkInvoiceReminder({
			auth,
			organizationId: propsValue.organizationId,
			invoiceIds,
		});
	},
});

const MAX_INVOICES = 10;
