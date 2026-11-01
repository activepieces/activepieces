import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceUtils } from '../../../common/utils';
import { zohoInvoiceMessageOutputSchema } from '../../../output-schemas';

export const emailContactStatementAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_email_contact_statement',
	outputSchema: zohoInvoiceMessageOutputSchema,
	displayName: 'Email Contact Statement',
	description: 'Emails a customer contact their account statement.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sends a real email with the contact's account statement PDF for a date range (default: the current month). Use List Contacts to find the contact ID, and Get Contact Statement Email Content for the default subject, body and recipients. Not idempotent: each call sends another email.",
		idempotent: false,
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
		toMailIds: Property.Array({
			displayName: 'To',
			description: 'Recipient email addresses.',
			required: true,
		}),
		ccMailIds: Property.Array({
			displayName: 'CC',
			description: 'Email addresses to copy.',
			required: false,
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
		sendFromOrgEmailId: zohoInvoiceAiProps.yesNo({
			required: false,
			displayName: 'Send From Organization Email',
			description:
				"Send from the organization's email address instead of the user's. Empty = the vendor default.",
		}),
	},
	async run({ auth, propsValue }) {
		const toMailIds = toEmailList({ value: propsValue.toMailIds, propName: 'To' });
		const ccMailIds = toEmailList({ value: propsValue.ccMailIds, propName: 'CC' });
		return await zohoInvoiceApi.emailContactStatement({
			auth,
			organizationId: propsValue.organizationId,
			contactId: propsValue.contactId,
			startDate: propsValue.startDate,
			endDate: propsValue.endDate,
			body: zohoInvoiceUtils.compact({
				to_mail_ids: toMailIds,
				cc_mail_ids: ccMailIds,
				subject: propsValue.subject,
				body: propsValue.body,
				send_from_org_email_id: zohoInvoiceUtils.toOptionalBoolean({
					value: propsValue.sendFromOrgEmailId,
				}),
			}),
		});
	},
});

function toEmailList({
	value,
	propName,
}: {
	value: unknown[] | undefined;
	propName: string;
}): string[] | undefined {
	if (value === undefined) {
		return undefined;
	}
	if (!value.every((email): email is string => typeof email === 'string' && email !== '')) {
		throw new Error(`${propName} must be a list of email addresses.`);
	}
	return value;
}
