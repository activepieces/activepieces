import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { microsoftTodoCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const updateTaskListAction = createAction({
  auth: microsoftToDoAuth,
  name: 'update_task_list',
  displayName: 'Update Task List',
  description: 'Updates the name of an existing task list.',
  props: {
    listId: Property.Dropdown({
      displayName: 'Task List',
      description: 'The task list to update.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }
        return await microsoftTodoCommon.getTaskListsDropdown(
          auth as OAuth2PropertyValue
        );
      },
    }),
    displayName: Property.ShortText({
      displayName: 'New List Name',
      description: 'The new name for the task list.',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const listId = propsValue['listId'];
    const newDisplayName = propsValue['displayName'];
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
    const endpoint = `/me/todo/lists/${listId}`;
    const response = await client.api(endpoint).patch({
      displayName: newDisplayName,
    });
    return response;
  },
});
