import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { logCallOutputSchema } from '../../output-schemas';

export const logCall = createAction({
	auth: salesforceAuth,
	name: 'log_call',
	classification: 'WRITE',
	displayName: 'Log Call',
	description: 'Record a completed phone call as an activity.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Logs a phone call that already happened as a closed Call task on a Contact or Lead (Who ID) and/or an Account, Opportunity or other record (What ID), with duration, direction, outcome and notes; the date defaults to today (UTC). Use Create Task for a to-do that is still open. Not idempotent: each call logs another activity.",
		idempotent: false,
	},
	outputSchema: logCallOutputSchema,
	props: {
		subject: Property.ShortText({ displayName: 'Subject', description: 'e.g. Call with Jane about renewal.', required: true }),
		who_id: Property.ShortText({ displayName: 'Who ID', description: 'Contact or Lead id.', required: false }),
		what_id: Property.ShortText({ displayName: 'What ID', description: 'Account, Opportunity, Case or other record id.', required: false }),
		call_type: Property.StaticDropdown({
			displayName: 'Call Type',
			required: false,
			options: {
				options: [
					{ label: 'Inbound', value: 'Inbound' },
					{ label: 'Outbound', value: 'Outbound' },
					{ label: 'Internal', value: 'Internal' },
				],
			},
		}),
		duration_seconds: Property.Number({ displayName: 'Duration (Seconds)', required: false }),
		call_disposition: Property.ShortText({ displayName: 'Call Result', description: 'Outcome, e.g. Left voicemail.', required: false }),
		description: Property.LongText({ displayName: 'Notes', required: false }),
		activity_date: Property.ShortText({ displayName: 'Call Date', description: 'YYYY-MM-DD. Defaults to today.', required: false }),
		owner_id: Property.ShortText({ displayName: 'Owner ID', description: 'User who made the call. Defaults to you.', required: false }),
	},
	async run(context) {
		const { subject, who_id, what_id, call_type, duration_seconds, call_disposition, description, activity_date, owner_id } = context.propsValue;
		const activityDate = crmUtils.assertDate({ value: activity_date, fieldName: 'Call Date' }) ?? new Date().toISOString().slice(0, 10);
		const status = await crmUtils.getClosedTaskStatus({ auth: context.auth });
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'Task',
			fields: {
				TaskSubtype: 'Call',
				Status: status,
				Subject: subject,
				WhoId: who_id,
				WhatId: what_id,
				CallType: call_type,
				CallDurationInSeconds: duration_seconds,
				CallDisposition: call_disposition,
				Description: description,
				ActivityDate: activityDate,
				OwnerId: owner_id,
			},
			additionalFields: undefined,
		});
		return { ...result, subject, status, activity_date: activityDate };
	},
});
