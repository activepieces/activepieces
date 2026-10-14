import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createSfTaskOutputSchema } from '../../output-schemas';

export const createSfTask = createAction({
	auth: salesforceAuth,
	name: 'create_sf_task',
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Create a new task (to-do) in Salesforce.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Salesforce Task with a required Subject, optionally linked to a Contact or Lead (Who ID) and to an Account, Opportunity or other record (What ID), with owner, due date (YYYY-MM-DD), status, priority and description. Use Log Call to record a call that already happened, and Complete Task to close one. Not idempotent: each call creates a new Task.',
		idempotent: false,
	},
	outputSchema: createSfTaskOutputSchema,
	props: {
		Subject: Property.ShortText({ displayName: 'Subject', required: true }),
		WhoId: Property.ShortText({ displayName: 'Who ID', description: 'Contact or Lead id.', required: false }),
		WhatId: Property.ShortText({ displayName: 'What ID', description: 'Account, Opportunity, Case or other record id.', required: false }),
		OwnerId: Property.ShortText({ displayName: 'Assigned To (User ID)', required: false }),
		ActivityDate: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
		Status: Property.ShortText({ displayName: 'Status', description: 'Task status picklist value, e.g. Not Started.', required: false }),
		Priority: Property.ShortText({ displayName: 'Priority', description: 'e.g. High, Normal or Low.', required: false }),
		Description: Property.LongText({ displayName: 'Description', required: false }),
		additional_fields: crmUtils.additionalFieldsProp,
	},
	async run(context) {
		const { additional_fields, ...fields } = context.propsValue;
		const result = await crmUtils.createRecord({
			auth: context.auth,
			object: 'Task',
			fields: { ...fields, ActivityDate: crmUtils.assertDate({ value: fields.ActivityDate, fieldName: 'Due Date' }) },
			additionalFields: additional_fields,
		});
		return { ...result, subject: fields.Subject };
	},
});
