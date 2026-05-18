import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { linkedRecordDropdown, objectTypeIdDropdown } from '../common/props';

export const createTaskAction = createAction({
	auth: attioAuth,
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Create a new task in Attio, optionally linked to a record and assigned to a member.',
	props: {
		content: Property.LongText({
			displayName: 'Task Content',
			description: 'The text content of the task.',
			required: true,
		}),
		deadline_at: Property.DateTime({
			displayName: 'Deadline',
			required: false,
		}),
		is_completed: Property.Checkbox({
			displayName: 'Mark as Completed',
			required: false,
		}),
		linked_object: objectTypeIdDropdown({
			displayName: 'Linked Object',
			description: 'The object type of the record to link this task to.',
			required: false,
		}),
		linked_record_id: linkedRecordDropdown({
			displayName: 'Linked Record',
			description: 'The record to link this task to.',
			required: false,
		}),
		assignee_email: Property.ShortText({
			displayName: 'Assignee Email',
			description: 'Email address of the workspace member to assign this task to.',
			required: false,
		}),
	},
	async run(context) {
		const { content, deadline_at, is_completed, linked_object, linked_record_id, assignee_email } =
			context.propsValue;

		const linked_records: Array<Record<string, string>> = [];
		if (linked_object && linked_record_id) {
			linked_records.push({ target_object: linked_object, target_record_id: linked_record_id });
		}

		const assignees: Array<Record<string, string>> = [];
		if (assignee_email) {
			assignees.push({ workspace_member_email_address: assignee_email });
		}

		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/tasks',
			body: {
				data: {
					content,
					format: 'plaintext',
					deadline_at: deadline_at ?? null,
					is_completed: is_completed ?? false,
					linked_records,
					assignees,
				},
			},
		});

		return response.data;
	},
});
