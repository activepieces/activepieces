import { createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../auth';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';

export const listTaskListsAction = createAction({
	auth: microsoftToDoAuth,
	name: 'list_task_lists',
	displayName: 'List Task Lists',
	description: 'Returns a list of all task lists.',
	props: {},
	async run(context) {
		const { auth } = context;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const result: TodoTaskList[] = [];
		let response: PageCollection = await client.api('/me/todo/lists').get();

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
