import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

export const updateTask = createAction({
	auth: fragmentAuth,
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Updates an existing task.',
	props: {
		task_uid: Property.ShortText({
			displayName: 'Task UID',
			description: 'The unique identifier of the task to update',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The updated title of the task',
			required: false,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'The updated URL for the task',
			required: false,
		}),
		due_at: Property.DateTime({
			displayName: 'Due Date',
			description: 'The updated due date',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'The status of the task',
			required: false,
			options: {
				options: [
					{ label: 'TODO', value: 'TODO' },
					{ label: 'STARTED', value: 'STARTED' },
					{ label: 'DONE', value: 'DONE' },
				],
			},
		}),
		assignee: Property.ShortText({
			displayName: 'Assignee',
			description: 'Email of the person to assign this task to',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Updated tags for the task',
			required: false,
		}),
		custom_fields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Updated custom fields',
			required: false,
		}),
	},
	async run(context) {
		const fields: Record<string, any> = {
			...(context.propsValue.custom_fields ?? {}),
		};
		const taskPayload: Record<string, any> = {};

		if (context.propsValue.title) {
			fields['title'] = context.propsValue.title;
		}
		if (context.propsValue.url) {
			fields['url'] = context.propsValue.url;
		}
		if (context.propsValue.due_at) {
			taskPayload['due_at'] = context.propsValue.due_at;
		}
		if (context.propsValue.status) {
			taskPayload['status'] = context.propsValue.status;
		}
		if (context.propsValue.assignee) {
			taskPayload['assignee_email'] = context.propsValue.assignee;
		}
		if (context.propsValue.tags && Array.isArray(context.propsValue.tags)) {
			taskPayload['tags'] = context.propsValue.tags;
		}

    if(!isEmpty(fields)) taskPayload['fields'] = fields;

		const response = await fragmentClient.makeRequest(
			HttpMethod.PATCH,
			`/tasks/${context.propsValue.task_uid}`,
			context.auth,
			taskPayload
		);

		return response;
	},
});
