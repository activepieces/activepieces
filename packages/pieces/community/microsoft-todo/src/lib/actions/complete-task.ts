import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { TodoTask } from '@microsoft/microsoft-graph-types';

export const completeTaskAction = createAction({
    auth: microsoftToDoAuth,
    name: 'complete_task',
    displayName: 'Complete Task',
    description: 'Marks a task as completed.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list containing the task you want to complete.',
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
        task_id: Property.Dropdown({
            displayName: 'Task',
            description: 'The specific task to mark as complete.',
            required: true,
            refreshers: ['task_list_id'],
            options: async ({ auth, task_list_id }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                if (!task_list_id) {
                    return { disabled: true, placeholder: 'Select a task list first', options: [] };
                }
                return await getTasksInListDropdown(
                    auth as OAuth2PropertyValue,
                    task_list_id as string
                );
            },
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, task_id } = propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });


        const taskUpdate: Partial<TodoTask> = {
            status: 'completed',
            completedDateTime: {
                dateTime: new Date().toISOString(),
                timeZone: 'UTC',
            },
        };

        const response = await client
            .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}`)
            .update(taskUpdate);

        return response;
    },
});