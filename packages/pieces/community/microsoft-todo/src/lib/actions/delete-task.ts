import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { getTaskListsDropdown } from '../common';

export const deleteTask = createAction({
  auth: microsoftToDoAuth,
  name: 'deleteTask',
  displayName: 'Delete Task',
  description: 'Deletes an existing Microsoft To Do task.',
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
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to delete.',
      required: true,
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

    await client
      .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}`)
      .delete();

    return { success: true };
  },
});