import { todoistAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistRestClient } from '../common/client/rest-client';
import { assertNotNullOrUndefined } from '@activepieces/shared';

export const todoistFindTaskAction = createAction({
	auth: todoistAuth,
	name: 'find_task',
	displayName: 'Find Task',
	description: 'Finds a task by name.',
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the task to search for.',
			required: true,
		}),
		project_id: todoistProjectIdDropdown(
			'Search for tasks within the selected project. If left blank, then all projects are searched.',
		),
	},
	async run(context) {
		const token = context.auth.access_token;
		const { name, project_id } = context.propsValue;

		assertNotNullOrUndefined(token, 'token');
		const tasks = await todoistRestClient.tasks.list({ token, project_id });

		const matchedTask = tasks.find((task) => task.content == name);
		if (!matchedTask) {
			throw new Error('Task not found');
		} else {
			return matchedTask;
		}
	},
});
