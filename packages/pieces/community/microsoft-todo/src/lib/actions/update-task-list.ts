import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { getTaskListsDropdown } from '../common';

export const updateTaskList = createAction({
  auth: microsoftToDoAuth,
  name: 'updateTaskList',
  displayName: 'Update Task List',
  description: 'Updates an existing Microsoft To Do task list.',
  props: {
    task_list_id: Property.Dropdown({
      displayName: 'Task List',
      description: 'The task list to update.',
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
    displayName: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name for the task list.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { task_list_id, displayName } = propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });

    const response = await client
      .api(`/me/todo/lists/${task_list_id}`)
      .patch({ displayName });

    return response;
  },
});