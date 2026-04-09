import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../auth';
import { createTodoClient } from '../common';

export const createTaskListAction = createAction({
	auth: microsoftToDoAuth,
	name: 'create_task_list',
	displayName: 'Create Task List',
	description: 'Create a new task list.',
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
