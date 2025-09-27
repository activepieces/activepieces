import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { TodoTaskList } from '@microsoft/microsoft-graph-types';

export const updateTaskListAction = createAction({
    auth: microsoftToDoAuth,
    name: 'update_task_list',
    displayName: 'Update Task List',
    description: 'Updates an existing task list.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list to update.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            },
        }),
        display_name: Property.ShortText({
            displayName: 'Display Name',
            description: 'New name of the task list.',
            required: true,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, display_name } = propsValue;

        const client = Client.initWithMiddleware({
            authProvider: { getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token) },
        });

        const body: Partial<TodoTaskList> = { displayName: display_name };

        const response = await client
            .api(`/me/todo/lists/${task_list_id}`)
            .update(body);

        return response;
    },
});


