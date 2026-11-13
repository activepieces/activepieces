import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceEmailInvoiceOutputSchema } from '../../../output-schemas';

export const emailInvoiceAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_invoice',
	outputSchema: zohoInvoiceEmailInvoiceOutputSchema,
	displayName: 'Email Invoice',
	description: 'Emails an invoice to the given recipients.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a real email with the invoice to the given addresses and marks a draft invoice as sent. Use Get Invoice Email Content for the default subject and body,. Not idempotent: each call sends another email.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		invoiceId: zohoInvoiceAiProps.invoiceId({ required: true }),
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Email addresses to send the invoice to.',
			required: true,
		}),
		ccMailIds: Property.Array({
			displayName: 'CC',
			description: 'Email addresses to copy.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject. Empty = the default invoice email subject.',
			required: false,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body (HTML allowed). Empty = the default invoice email body.',
			required: false,
		}),
		sendFromOrgEmailId: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send From Organization Email',
			description: 'Yes to send from the organization email address instead of the user email.',
		}),
		sendAttachment: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Attach Invoice File',
			description: 'Yes to include the file attached to the invoice.',
		}),
		sendCustomerStatement: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Attach Customer Statement',
			description: 'Yes to include the customer statement PDF.',
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.emailInvoice({
			auth,
			organizationId: propsValue.organizationId,
			invoiceId: propsValue.invoiceId,
			sendAttachment: zohoInvoiceUtils.toOptionalBoolean({ value: propsValue.sendAttachment }),
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
