import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const emailContactAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_contact',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Email Contact',
	description: 'Sends an email to a customer contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a real email to a contact from Zoho Invoice, optionally with their statement PDF attached. Use List Contacts to find the contact ID. To send only a statement for a date range use Email Contact Statement. Not idempotent: each call sends another email.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Recipient email addresses.',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject.',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body. HTML is allowed.',
			required: true,
		}),
		sendCustomerStatement: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Attach Statement',
			description: "Attach the contact's statement PDF. Empty = no.",
		}),
	},
	async run({ auth, propsValue }) {
		const { toMailIds } = propsValue;
		if (!toMailIds.every((email): email is string => typeof email === 'string' && email !== '')) {
			throw new Error('To must be a list of email addresses.');
		}
		return await zohoInvoiceApi.emailContact({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			sendCustomerStatement: zohoInvoiceUtils.toOptionalBoolean({
				value: propsValue.sendCustomerStatement,
			}),
			body: {
				to_mail_ids: toMailIds,
				subject: propsValue.subject,
				body: propsValue.body,
			},
		});
	},
});
