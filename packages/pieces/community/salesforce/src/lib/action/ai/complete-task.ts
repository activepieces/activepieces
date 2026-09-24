import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { crmUtils } from '../../common/crm';
import { salesforceUtils } from '../../common/utils';
import { completeTaskOutputSchema } from '../../output-schemas';

export const completeTask = createAction({
	auth: salesforceAuth,
	name: 'complete_task',
	classification: 'WRITE',
	displayName: 'Complete Task',
	description: 'Mark a task as completed.',
	audience: 'ai',
	aiMetadata: {
		description:
			"Marks an existing Salesforce Task as done by setting its status to the org's first closed task status (usually Completed), optionally appending a closing note to its description. Use Update Task for other changes. Safe to retry, but a closing note is appended again on every call.",
		idempotent: true,
	},
	outputSchema: completeTaskOutputSchema,
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
		closing_note: Property.LongText({ displayName: 'Closing Note', description: 'Text appended to the task description.', required: false }),
	},
	async run(context) {
		const id = salesforceUtils.assertId({ value: context.propsValue.task_id, fieldName: 'Task ID' });
		const note = context.propsValue.closing_note?.trim();
		const status = await crmUtils.getClosedTaskStatus({ auth: context.auth });
		const description = note ? await appendToDescription({ auth: context.auth, id, note }) : undefined;
		const body = salesforceUtils.compact({ Status: status, Description: description });
		await callSalesforceApi(HttpMethod.PATCH, context.auth, `/services/data/v56.0/sobjects/Task/${id}`, body);
		return { id, success: true, status, updated_fields: Object.keys(body) };
	},
});

async function appendToDescription({ auth, id, note }: { auth: OAuth2PropertyValue; id: string; note: string }): Promise<string> {
	const response = await callSalesforceApi<{ Description: string | null }>(
		HttpMethod.GET,
		auth,
		`/services/data/v56.0/sobjects/Task/${id}?fields=Description`,
		undefined
	);
	const current = response.body.Description;
	return current ? `${current}\n\n${note}` : note;
}
