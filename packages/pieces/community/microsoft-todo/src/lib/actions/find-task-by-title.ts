import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';

import { TodoTask } from '@microsoft/microsoft-graph-types';

export const findTaskByTitleAction = createAction({
	auth: microsoftToDoAuth,
	name: 'find_task_by_title',
	displayName: 'Find Task',
	description: 'Finds tasks by title.',
	props: {
		task_list_id: Property.Dropdown({
			displayName: 'Task List',
			description: 'Select a specific task list to search within.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return { disabled: true, placeholder: 'Connect your account first', options: [] };
				}
				return await getTaskListsDropdown(auth as OAuth2PropertyValue);
			},
		}),
		title: Property.ShortText({
			displayName: 'Task Title',
			description: 'The title (or partial title) of the task to find.',
			required: true,
		}),

		match_type: Property.StaticDropdown({
			displayName: 'Match Type',
			description: 'How to match the task title.',
			required: false,
			defaultValue: 'contains',
			options: {
				options: [
					{ label: 'Contains', value: 'contains' },
					{ label: 'Starts With', value: 'startsWith' },
					{ label: 'Exact Match', value: 'exact' },
				],
			},
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const { title, task_list_id, match_type } = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		let titleFilterString = '';
		switch (match_type) {
			case 'startsWith':
				titleFilterString = `startsWith(title, '${title}')`;
				break;
			case 'exact':
				titleFilterString = `title eq '${title}'`;
				break;
			case 'contains':
			default:
				titleFilterString = `contains(title, '${title}')`;
				break;
		}

		const result = [];

		let response: PageCollection = await client
			.api(`/me/todo/lists/${task_list_id}/tasks`)
			.filter(titleFilterString)
			.get();

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
