import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceSendInvoicePaymentReminderOutputSchema } from '../../../output-schemas';

export const sendInvoicePaymentReminderAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_send_invoice_payment_reminder',
	outputSchema: zohoInvoiceSendInvoicePaymentReminderOutputSchema,
	displayName: 'Send Invoice Payment Reminder',
	description: 'Emails a payment reminder for an unpaid invoice.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a real payment reminder email for one open or overdue invoice. Use Get Invoice Payment Reminder Content for the default text, and Send Bulk Invoice Reminder for several invoices. Use List Invoices to find the ID. Not idempotent: each call sends another email.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Email addresses to send the reminder to. Empty = the invoice contacts.',
			required: false,
		}),
		ccMailIds: Property.Array({
			displayName: 'CC',
			description: 'Email addresses to copy.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject. Empty = the default reminder subject.',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body (HTML allowed). Empty = the default reminder body.',
			required: false,
		}),
		sendFromOrgEmailId: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send From Organization Email',
			description: 'Yes to send from the organization email address instead of the user email.',
		}),
		sendCustomerStatement: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Attach Customer Statement',
			description: 'Yes to include the customer statement PDF.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.sendInvoicePaymentReminder({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			sendCustomerStatement: zohoInvoiceUtils.toOptionalBoolean({
				value: propsValue.sendCustomerStatement,
			}),
			body: zohoInvoiceUtils.compact({
				to_mail_ids: propsValue.toMailIds,
				cc_mail_ids: propsValue.ccMailIds,
				subject: propsValue.subject,
				body: propsValue.body,
				send_from_org_email_id: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.sendFromOrgEmailId,
				}),
			}),
		});
	},
});
