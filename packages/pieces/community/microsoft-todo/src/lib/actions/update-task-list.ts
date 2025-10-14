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
                const authValue = auth as OAuth2PropertyValue;
                if (!authValue?.access_token) {
                    return {
                        disabled: true,
                        placeholder: 'Connect your account first',
                        options: [],
                    };
                }
                return await getTaskListsDropdown(authValue);
            },
        }),
        displayName: Property.ShortText({
            displayName: 'New Name',
            description: 'The new name for the task list.',
            required: true,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, displayName } = propsValue;

        if (!task_list_id) {
            throw new Error('Task List ID is required');
        }

        if (!displayName || displayName.trim().length === 0) {
            throw new Error('New Name cannot be empty. Please provide a valid name for the task list.');
        }

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        try {
            const taskListBody: Partial<TodoTaskList> = {
                displayName: displayName.trim(),
            };

            const response = await client
                .api(`/me/todo/lists/${task_list_id}`)
                .update(taskListBody);

            return response as TodoTaskList;
        } catch (error: any) {
            throw new Error(`Failed to update task list: ${error?.message || error}`);
        }
    },
});