import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { linkedRecordDropdown, objectTypeIdDropdown, taskIdDropdown } from '../common/props';
import { isNil } from '@activepieces/shared';

export const updateTaskAction = createAction({
	auth: attioAuth,
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Update an existing task in Attio.',
	props: {
		task_id: taskIdDropdown({
			displayName: 'Task',
			description: 'The task to update.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Task Content',
			description: 'Update the text content of the task.',
			required: false,
		}),
		deadline_at: Property.DateTime({
			displayName: 'Deadline',
			description: 'Update the task deadline. Leave empty to keep existing value.',
			required: false,
		}),
		is_completed: Property.StaticDropdown({
			displayName: 'Completion Status',
			description: 'Update the completion status of the task.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Mark as Completed', value: 'true' },
					{ label: 'Mark as Incomplete', value: 'false' },
				],
			},
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
		const { task_id, content, deadline_at, is_completed, linked_object, linked_record_id, assignee_email } =
			context.propsValue;

		const body: Record<string, unknown> = {};

		if (content) {
			body['content'] = content;
			body['format'] = 'plaintext';
		}
		if (!isNil(deadline_at)) body['deadline_at'] = deadline_at;
		if (!isNil(is_completed)) body['is_completed'] = is_completed === 'true';

		if (linked_object && linked_record_id) {
			body['linked_records'] = [
				{ target_object: linked_object, target_record_id: linked_record_id },
			];
		}

		if (assignee_email) {
			body['assignees'] = [{ workspace_member_email_address: assignee_email }];
		}

		if (Object.keys(body).length === 0) {
			throw new Error('At least one field must be provided to update the task.');
		}

		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/tasks/${task_id}`,
			body: { data: body },
		});

		return response.data;
	},
});
