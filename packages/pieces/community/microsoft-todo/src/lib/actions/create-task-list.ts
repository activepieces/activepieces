import { Property, createAction } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

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

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const response = await client.api('/me/todo/lists').post({
			displayName: propsValue.displayName,
		});

		return response;
	},
});
