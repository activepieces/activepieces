import { todoistAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistRestClient } from '../common/client/rest-client';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { findTaskActionOutputSchema } from '../output-schemas';

export const todoistFindTaskAction = createAction({
	auth: todoistAuth,
	name: 'find_task',
	classification: 'READ',
	displayName: 'Find Task',
	description: 'Find an open task by its exact title.',
	audience: 'human',
	aiMetadata: { description: 'Looks up an active Todoist task by exact content match, optionally scoped to one project (all projects if left blank). Use to resolve a task name to its full record (including its ID) before updating or completing it. Read-only and idempotent; errors if no task matches the name exactly.', idempotent: true },
	outputSchema: findTaskActionOutputSchema,
	propertyGroups: [
		{
			key: 'search',
			display: 'section',
			label: 'Search',
			icon: 'filter',
			props: ['name', 'project_id'],
		},
	],
	props: {
		name: Property.ShortText({
			displayName: 'Title',
			description: 'Matches an open task whose title is exactly this text.',
			placeholder: 'e.g. Buy milk',
			required: true,
		}),
		project_id: todoistProjectIdDropdown('Leave empty to search every project.'),
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
