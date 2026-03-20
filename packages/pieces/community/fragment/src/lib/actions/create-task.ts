import { createAction, Property } from '@activepieces/pieces-framework';
import { fragmentAuth } from '../common/auth';
import { fragmentClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
	auth: fragmentAuth,
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Creates a new task in Fragment.',
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the task',
			required: true,
		}),
		url: Property.ShortText({
			displayName: 'URL',
			description: 'A URL associated with the task (e.g., link to a ticket or resource)',
			required: false,
		}),
		due_at: Property.DateTime({
			displayName: 'Due Date',
			description: 'When the task is due',
			required: false,
		}),
		assignee: Property.ShortText({
			displayName: 'Assignee',
			description: 'Email of the person to assign this task to.',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Tags to categorize the task',
			required: false,
		}),
		custom_fields: Property.Object({
			displayName: 'Custom Fields',
			description: 'Additional custom fields for the task',
			required: false,
		}),
	},
	async run(context) {
		const fields: Record<string, any> = {
			title: context.propsValue.title,
			...(context.propsValue.custom_fields ?? {}),
		};

		const taskPayload: Record<string, any> = {
			fields,
		};

		if (context.propsValue.url) {
			fields['url'] = context.propsValue.url;
		}
		if (context.propsValue.due_at) {
			taskPayload['due_at'] = context.propsValue.due_at;
		}

		if (context.propsValue.assignee) {
			taskPayload['assignee_email'] = context.propsValue.assignee;
		}
		if (context.propsValue.tags && Array.isArray(context.propsValue.tags)) {
			taskPayload['tags'] = context.propsValue.tags;
		}

		const response = await fragmentClient.makeRequest(HttpMethod.POST, '/tasks', context.auth, taskPayload);

		return response;
	},
});
