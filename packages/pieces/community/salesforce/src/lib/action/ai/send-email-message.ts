import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { sendEmailMessageOutputSchema } from '../../output-schemas';

export const sendEmailMessage = createAction({
	auth: salesforceAuth,
	name: 'send_email_message',
	classification: 'WRITE',
	displayName: 'Send Email Message',
	description: 'Send a real email through Salesforce.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Actually delivers an email from Salesforce (the standard Send Email action) to email addresses and/or a Contact, Lead or User id, optionally logged against a related record. Pick it when the email must reach the inbox; to only record an email that was sent elsewhere use Log Email Activity. Counts against the org daily external email limit, which is very small on Developer Edition orgs. Not idempotent: every call sends another email.',
		idempotent: false,
	},
	outputSchema: sendEmailMessageOutputSchema,
	props: {
		email_addresses: Property.Array({
			displayName: 'Email Addresses',
			description: 'Recipient email addresses. Required unless Recipient ID is set.',
			required: false,
		}),
		recipient_id: Property.ShortText({
			displayName: 'Recipient ID',
			description: 'Id of a Contact, Lead or User to send to.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Plain-text email body.',
			required: true,
		}),
		sender_type: Property.StaticDropdown({
			displayName: 'Sender Type',
			description: 'Who the email is sent from. Defaults to the current user.',
			required: false,
			options: {
				options: [
					{ label: 'Current User', value: 'CurrentUser' },
					{ label: 'Default Workflow User', value: 'DefaultWorkflowUser' },
					{ label: 'Org-Wide Email Address', value: 'OrgWideEmailAddress' },
				],
			},
		}),
		sender_address: Property.ShortText({
			displayName: 'Sender Address',
			description: 'Verified org-wide email address. Required when Sender Type is Org-Wide Email Address.',
			required: false,
		}),
		related_record_id: Property.ShortText({
			displayName: 'Related Record ID',
			description: 'Id of a record (Account, Opportunity, Case…) to log the email against.',
			required: false,
		}),
		use_line_breaks: Property.Checkbox({
			displayName: 'Use Line Breaks',
			description: 'Keep the line breaks of the body in the sent email.',
			required: false,
		}),
	},
	async run(context) {
		const { subject, body, sender_type, sender_address, use_line_breaks } = context.propsValue;
		const emailAddresses = salesforceUtils.toStringArray(context.propsValue.email_addresses);
		const recipientId = context.propsValue.recipient_id
			? salesforceUtils.assertId({ value: context.propsValue.recipient_id, fieldName: 'Recipient ID' })
			: undefined;
		const relatedRecordId = context.propsValue.related_record_id
			? salesforceUtils.assertId({ value: context.propsValue.related_record_id, fieldName: 'Related Record ID' })
			: undefined;
		if (emailAddresses.length === 0 && !recipientId) {
			throw new Error('Provide at least one Email Address or a Recipient ID.');
		}
		if (sender_type === 'OrgWideEmailAddress' && !sender_address) {
			throw new Error('Sender Address is required when Sender Type is Org-Wide Email Address.');
		}
		const input = salesforceUtils.compact({
			emailAddressesArray: emailAddresses.length > 0 ? emailAddresses : undefined,
			recipientId,
			relatedRecordId,
			emailSubject: subject,
			emailBody: body,
			senderType: sender_type,
			senderAddress: sender_address,
			useLineBreaks: use_line_breaks ? true : undefined,
		});
		const response = await callSalesforceApi<EmailSimpleResult[]>(
			HttpMethod.POST,
			context.auth,
			'/services/data/v56.0/actions/standard/emailSimple',
			{ inputs: [input] },
		);
		const result = response.body[0];
		if (!result || !result.isSuccess) {
			const messages = (result?.errors ?? []).map((error) => error.message).join('; ');
			throw new Error(`Salesforce did not send the email: ${messages || 'unknown error'}`);
		}
		return {
			success: true,
			email_addresses: emailAddresses,
			recipient_id: recipientId ?? null,
			related_record_id: relatedRecordId ?? null,
			subject,
		};
	},
});

type EmailSimpleResult = {
	actionName: string;
	errors: { statusCode?: string; message: string; fields?: string[] }[] | null;
	isSuccess: boolean;
	outputValues: Record<string, unknown> | null;
};
