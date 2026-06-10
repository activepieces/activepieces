import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../auth';
import { createTodoClient } from '../common';

export const createTaskListAction = createAction({
	auth: microsoftToDoAuth,
	name: 'create_task_list',
	displayName: 'Create Task List',
	description: 'Create a new task list.',
	audience: 'both',
	aiMetadata: { description: 'Create a new Microsoft To Do task list (a named container for tasks) for the authenticated user. Use when a task needs to live in a list that does not yet exist. Not idempotent — repeating the call creates another list with the same name rather than reusing the existing one.', idempotent: false },
	props: {
		displayName: Property.ShortText({
			displayName: 'Title',
			description: 'The name for the new task list.',
			required: true,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;

		const client = createTodoClient(auth);

		const response = await client.api('/me/todo/lists').post({
			displayName: propsValue.displayName,
		});

		return response;
	},
});
