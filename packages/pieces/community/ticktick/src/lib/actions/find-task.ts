import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';
import { projectId } from '../common/props';

export const findTaskAction = createAction({
	auth: ticktickAuth,
	name: 'find_task',
	displayName: 'Find Task',
	description: 'Finds tasks in a specific project by their title.',
	props: {
		projectId: projectId({
			displayName: 'List',
			description: 'The list to search within.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Task Title',
			required: true,
		}),
		matchType: Property.StaticDropdown({
			displayName: 'Match Type',
			description: 'Select how the title should be matched.',
			required: true,
			options: {
				options: [
					{ label: 'Contains (case-insensitive)', value: 'contains' },
					{ label: 'Exact Match (case-insensitive)', value: 'exact' },
				],
			},
			defaultValue: 'contains',
		}),
	},
	async run(context) {
		const { projectId, title, matchType } = context.propsValue;

		if (!projectId || !title) {
			return [];
		}

		const response = await tickTickApiCall<{
			tasks: { id: string; title: string }[];
		}>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${projectId}/data`,
		});

		const foundTasks = [];

		for (const task of response.tasks) {
			if (matchType === 'exact') {
				if (task.title.toLowerCase() === title.toLowerCase()) {
					foundTasks.push(task);
				}
			} else {
				// Default to 'contains'
				if (task.title.toLowerCase().includes(title.toLowerCase())) {
					foundTasks.push(task);
				}
			}
		}
		return {
			found: foundTasks.length > 0,
			result: foundTasks,
		};
	},
});
