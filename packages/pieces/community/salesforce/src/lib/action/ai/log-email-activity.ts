import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { logEmailActivityOutputSchema } from '../../output-schemas';

export const logEmailActivity = createAction({
	auth: salesforceAuth,
	name: 'log_email_activity',
	classification: 'WRITE',
	displayName: 'Log Email Activity',
	description: 'Record an email on a Contact or Lead without sending it.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an EmailMessage record marked as sent for a Contact or Lead, optionally related to another record, so the email shows in the activity history. It only records the email and does NOT deliver anything; to actually send an email use Send Email Message. Not idempotent: every call logs another email.',
		idempotent: false,
	},
	outputSchema: logEmailActivityOutputSchema,
	props: {
		recipient_id: Property.ShortText({
			displayName: 'Recipient ID',
			description: 'Id of the Contact or Lead the email was sent to.',
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
		}),
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email content, plain text or HTML.',
			required: true,
		}),
		related_record_id: Property.ShortText({
			displayName: 'Related Record ID',
			description: 'Id of a record (Account, Opportunity, Case…) to relate the email to.',
			required: false,
		}),
	},
	async run(context) {
		const { subject, body } = context.propsValue;
		const recipientId = salesforceUtils.assertId({ value: context.propsValue.recipient_id, fieldName: 'Recipient ID' });
		const relatedRecordId = context.propsValue.related_record_id
			? salesforceUtils.assertId({ value: context.propsValue.related_record_id, fieldName: 'Related Record ID' })
			: undefined;
		const response = await callSalesforceApi<{ id: string; success: boolean }>(
			HttpMethod.POST,
			context.auth,
			'/services/data/v56.0/sobjects/EmailMessage',
			salesforceUtils.compact({
				ToIds: [recipientId],
				Subject: subject,
				HtmlBody: body,
				Status: '3',
				RelatedToId: relatedRecordId,
			}),
		);
		return {
			id: response.body.id,
			success: response.body.success,
			recipient_id: recipientId,
			related_record_id: relatedRecordId ?? null,
			subject,
		};
	},
});
