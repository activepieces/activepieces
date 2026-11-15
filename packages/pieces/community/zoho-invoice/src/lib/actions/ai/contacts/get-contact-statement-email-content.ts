import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceGetContactStatementEmailContentOutputSchema } from '../../../output-schemas';

export const getContactStatementEmailContentAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_get_contact_statement_email_content',
	outputSchema: zohoInvoiceGetContactStatementEmailContentOutputSchema,
	displayName: 'Get Contact Statement Email Content',
	description: 'Gets the default email content for a customer statement.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns the default subject, body, sender options and recipients Zoho would use to email a contact's statement for a date range, without sending anything. Use it before Email Contact Statement. Use List Contacts to find the contact ID.",
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		contactId: zohoInvoiceAiProps.contactId({ required: true }),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description:
				'Statement start date, yyyy-mm-dd. Empty with End Date empty = the current month.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Statement end date, yyyy-mm-dd.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.getContactStatementEmailContent({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			startDate: propsValue.startDate,
			endDate: propsValue.endDate,
		});
	},
});
