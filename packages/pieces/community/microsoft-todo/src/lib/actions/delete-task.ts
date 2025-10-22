import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const deleteTaskAction = createAction({
    auth: microsoftToDoAuth,
    name: 'delete_task',
    displayName: 'Delete Task',
    description: 'Deletes an existing task.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The list containing the task you want to delete.',
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
        task_id: Property.Dropdown({
            displayName: 'Task',
            description: 'The specific task to delete.',
            required: true,
            refreshers: ['task_list_id'],
            options: async ({ auth, task_list_id }) => {
                const authValue = auth as OAuth2PropertyValue;
                if (!authValue?.access_token || !task_list_id) {
                    return {
                        disabled: true,
                        placeholder: !authValue?.access_token
                            ? 'Connect your account first'
                            : 'Select a task list first',
                        options: [],
                    };
                }
                return await getTasksInListDropdown(authValue, task_list_id as string);
            },
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, task_id } = propsValue;

        if (!task_list_id || !task_id) {
            throw new Error('Task List ID and Task ID are required');
        }

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        try {
            await client
                .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}`)
                .delete();

            return {
                success: true,
                message: 'Task deleted successfully.',
            };
        } catch (error: any) {
            throw new Error(`Failed to delete task: ${error?.message || error}`);
        }
    },
});