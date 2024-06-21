import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistProjectIdDropdown, todoistSectionIdDropdown } from '../common/props';
import { TodoistCreateTaskRequest } from '../common/models';
import { todoistAuth } from '../..';

export const todoistCreateTaskAction = createAction({
	auth: todoistAuth,
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Create task',
	props: {
		project_id: todoistProjectIdDropdown(
			"Task project ID. If not set, task is put to user's Inbox.",
		),
		content: Property.LongText({
			displayName: 'content',
			description: "The task's content. It may contain some markdown-formatted text and hyperlinks",
			required: true,
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
		section_id: todoistSectionIdDropdown,
	},

	async run({ auth, propsValue }) {
		const token = auth.access_token;
		const { project_id, content, description, labels, priority, due_date, section_id } =
			propsValue as TodoistCreateTaskRequest;

		assertNotNullOrUndefined(token, 'token');
		assertNotNullOrUndefined(content, 'content');
		return await todoistRestClient.tasks.create({
			token,
			project_id,
			content,
			description,
			labels,
			priority,
			due_date,
			section_id,
		});
	},
});
