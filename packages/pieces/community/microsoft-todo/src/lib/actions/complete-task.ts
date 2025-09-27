import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';

export const completeTask = createAction({
  auth: microsoftToDoAuth,
  name: 'completeTask',
  displayName: 'Complete Task',
  description: 'Marks a Microsoft To Do task as completed.',
  props: {
    task_list_id: Property.Dropdown({
      displayName: 'Task List',
      description: 'The task list containing the task.',
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
      description: 'The task to update.',
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

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });

    // PATCH the task to set status to completed
    const response = await client
      .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}`)
      .patch({ status: 'completed' });

    return response;
  },
});