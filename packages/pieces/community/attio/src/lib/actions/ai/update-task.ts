import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioUpdateTaskOutputSchema } from '../../output-schemas';

export const attioUpdateTaskAction = createAction({
	auth: attioAuth,
	name: 'attio_update_task',
	outputSchema: attioUpdateTaskOutputSchema,
	displayName: 'Update Task',
	description: 'Updates the deadline, completion, links or assignees of a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of a task. Linked Records and Assignee Emails replace the current ones when given; leaving them empty keeps the current ones, so links and assignees cannot be cleared to none. Content cannot be changed.',
		idempotent: true,
	},
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', description: 'From List Tasks or Create Task.', required: true }),
		deadline_at: Property.DateTime({ displayName: 'Deadline', required: false }),
		is_completed: attioAi.optionalBooleanProp({ displayName: 'Completed', description: 'Leave empty to keep the current state.' }),
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
		const { task_id, deadline_at, is_completed, linked_records, assignee_emails } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/tasks/${task_id}`,
			body: {
				data: attioAi.compact({
					deadline_at,
					is_completed: attioAi.toBoolean(is_completed),
					linked_records: linked_records && linked_records.length > 0 ? attioAi.records(linked_records) : undefined,
					assignees: assignee_emails && assignee_emails.length > 0
						? attioAi.strings(assignee_emails).map((email) => ({ workspace_member_email_address: email }))
						: undefined,
				}),
			},
		});
		return response.data;
	},
});
