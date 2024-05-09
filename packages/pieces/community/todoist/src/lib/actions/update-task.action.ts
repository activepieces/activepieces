import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';

export const todoistUpdateTaskAction = createAction({
	auth: todoistAuth,
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Updates an existing task.',
	props: {
		task_id: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'content',
			description: "The task's content. It may contain some markdown-formatted text and hyperlinks",
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description:
				'A description for the task. This value may contain some markdown-formatted text and hyperlinks.',
			required: false,
		}),
		labels: Property.Array({
			displayName: 'Labels',
			required: false,
			description:
				"The task's labels (a list of names that may represent either personal or shared labels)",
		}),
		priority: Property.Number({
			displayName: 'Priority',
			description: 'Task priority from 1 (normal) to 4 (urgent)',
			required: false,
		}),
		due_date: Property.ShortText({
			displayName: 'Due date',
			description: "Specific date in YYYY-MM-DD format relative to user's timezone",
			required: false,
		}),
	},

	async run({ auth, propsValue }) {
		const token = auth.access_token;
		const { task_id, content, description, priority, due_date } = propsValue;
		const labels = propsValue.labels as string[];

		assertNotNullOrUndefined(token, 'token');
		return await todoistRestClient.tasks.update({
			token,
			task_id,
			content,
			description,
			labels,
			priority,
			due_date,
		});
	},
});
