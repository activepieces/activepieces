import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';

export const findTaskListByNameAction = createAction({
	auth: microsoftToDoAuth,
	name: 'find_task_list_by_name',
	displayName: 'Find Task List',
	description: 'Finds a task list by its name.',
	props: {
		name: Property.ShortText({
			displayName: 'Title',
			description: 'The name (or partial name) of the task list to find.',
			required: true,
		}),
		match_type: Property.StaticDropdown({
			displayName: 'Match Type',
			description: 'How to match the list name.',
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
		const { name, match_type } = propsValue;

		let filterString = '';
		switch (match_type) {
			case 'startsWith':
				filterString = `startsWith(displayName, '${name}')`;
				break;
			case 'exact':
				filterString = `displayName eq '${name}'`;
				break;
			case 'contains':
			default:
				filterString = `contains(displayName, '${name}')`;
				break;
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const result = [];

		let response: PageCollection = await client.api('/me/todo/lists').filter(filterString).get();

		while (response.value.length > 0) {
			for (const list of response.value as TodoTaskList[]) {
				result.push(list);
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
