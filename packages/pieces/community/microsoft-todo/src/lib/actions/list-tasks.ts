import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../auth';
import { getTaskListsDropdown } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTask } from '@microsoft/microsoft-graph-types';

export const listTasksAction = createAction({
	auth: microsoftToDoAuth,
	name: 'list_tasks',
	displayName: 'List Tasks',
	description: 'Returns a list of all tasks in a specific list.',
	props: {
		task_list_id: Property.Dropdown({
			auth: microsoftToDoAuth,
			displayName: 'Task List',
			description: 'The task list to get tasks from.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				return await getTaskListsDropdown(auth as OAuth2PropertyValue);
			},
		}),
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Search for tasks by title.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Filter tasks by status.',
			required: false,
			options: {
				options: [
					{ label: 'Not Started', value: 'notStarted' },
					{ label: 'In Progress', value: 'inProgress' },
					{ label: 'Completed', value: 'completed' },
					{ label: 'Waiting On Others', value: 'waitingOnOthers' },
					{ label: 'Deferred', value: 'deferred' },
				],
			},
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { task_list_id, status, search } = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const result: TodoTask[] = [];
		let apiCall = client.api(`/me/todo/lists/${task_list_id}/tasks`);
		
		const filters: string[] = [];
		if (status) {
			filters.push(`status eq '${status}'`);
		}
		if (search) {
			const escapedSearch = search.replace(/'/g, "''");
			filters.push(`contains(title, '${escapedSearch}')`);
		}

		if (filters.length > 0) {
			apiCall = apiCall.filter(filters.join(' and '));
		}

		let response: PageCollection = await apiCall.get();

		while (response.value.length > 0) {
			for (const task of response.value as TodoTask[]) {
				result.push(task);
			}
			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return result;
	},
});
