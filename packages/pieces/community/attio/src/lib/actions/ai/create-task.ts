import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateTaskOutputSchema } from '../../output-schemas';

export const attioCreateTaskAction = createAction({
	auth: attioAuth,
	name: 'attio_create_task',
	outputSchema: attioCreateTaskOutputSchema,
	displayName: 'Create Task',
	description: 'Creates a task, optionally linked to records and assigned.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a task with optional deadline, linked records and assignees (by workspace member email). Task content cannot be changed later. Not idempotent.',
		idempotent: false,
	},
	props: {
		content: Property.LongText({ displayName: 'Content', required: true }),
		deadline_at: Property.DateTime({ displayName: 'Deadline', required: false }),
		is_completed: Property.Checkbox({ displayName: 'Completed', required: false }),
		linked_records: Property.Array({
			displayName: 'Linked Records',
			description: 'Records to link the task to.',
			required: false,
			properties: {
				target_object: Property.ShortText({ displayName: 'Object', description: 'Object slug, e.g. `companies`.', required: true }),
				target_record_id: Property.ShortText({ displayName: 'Record ID', required: true }),
			},
		}),
		assignee_emails: Property.Array({
			displayName: 'Assignee Emails',
			description: 'Workspace member email addresses to assign.',
			required: false,
		}),
	},
	async run(context) {
		const { content, deadline_at, is_completed, linked_records, assignee_emails } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/tasks`,
			body: {
				data: {
					content,
					format: 'plaintext',
					deadline_at: deadline_at ?? null,
					is_completed: is_completed ?? false,
					linked_records: attioAi.records(linked_records),
					assignees: attioAi.strings(assignee_emails).map((email) => ({ workspace_member_email_address: email })),
				},
			},
		});
		return response.data;
	},
});
