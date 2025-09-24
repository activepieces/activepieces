import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const markTaskComplete = createAction({
	name: 'mark_task_complete',
	displayName: 'Mark Task Complete',
	description: 'Set a task’s status to complete.',
	auth: teamworkAuth,
	props: {
		taskId: Property.Dropdown({
			displayName: 'Task',
			description: 'The task to mark as complete.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/tasks.json',
					query: {
						includeCompletedTasks: false,
					},
				});
				const options = res.data['todo-items'].map((task: { id: string; content: string }) => ({
					label: task.content,
					value: task.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await teamworkRequest(auth, {
			method: HttpMethod.PUT,
			path: `/tasks/${propsValue.taskId}/complete.json`,
		});
	},
});


