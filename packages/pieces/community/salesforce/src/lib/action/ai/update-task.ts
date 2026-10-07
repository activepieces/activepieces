import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { updateRecordOutputSchema } from '../../output-schemas';

export const updateTask = createAction({
	auth: salesforceAuth,
	name: 'update_task',
	classification: 'WRITE',
	displayName: 'Update Task',
	description: 'Update fields on an existing task.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates an existing Salesforce Task by id, e.g. its subject, due date (YYYY-MM-DD), status, priority, assignee or linked records; only the fields you supply change. To simply mark it done use Complete Task. At least one field is required; custom fields go in Additional Fields (null clears a value). Safe to retry with the same values.',
		idempotent: true,
	},
	outputSchema: updateRecordOutputSchema,
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
		Subject: Property.ShortText({ displayName: 'Subject', required: false }),
		WhoId: Property.ShortText({ displayName: 'Who ID', description: 'Contact or Lead id.', required: false }),
		WhatId: Property.ShortText({ displayName: 'What ID', description: 'Account, Opportunity, Case or other record id.', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Assigned To (User ID)', required: false }),
		ActivityDate: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
		Status: Property.ShortText({ displayName: 'Status', required: false }),
		Priority: Property.ShortText({ displayName: 'Priority', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { task_id, additional_fields, ...fields } = context.propsValue;
		return crmUtils.updateRecord({
			auth: context.auth,
			object: 'Task',
			recordId: task_id,
			fields: { ...fields, ActivityDate: crmUtils.assertDate({ value: fields.ActivityDate, fieldName: 'Due Date' }) },
			additionalFields: additional_fields,
		});
	},
});
