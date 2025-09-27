import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { microsoftTodoCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const deleteTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'delete_task',
  displayName: 'Delete Task',
  description: 'Deletes an existing task from a list.',
  props: {
    listId: Property.DynamicProperties({
      displayName: 'Task List',
      required: true,
      refreshers: [],
      props: async (context) => {
        const auth = context['auth'];
        return {
          listId: Property.Dropdown({
            displayName: 'Task List',
            required: true,
            refreshers: [],
            options: async () => {
              if (!auth)
                return {
                  disabled: true,
                  options: [],
                  placeholder: 'Connect your account first',
                };
              return await microsoftTodoCommon.getTaskListsDropdown(
                auth as OAuth2PropertyValue
              );
            },
          }),
        };
      },
    }),
    taskId: Property.DynamicProperties({
      displayName: 'Task',
      required: true,
      refreshers: ['listId'],
      props: async (context) => {
        const auth = context['auth'];
        const listId = context['propsValue']['listId'] as unknown as
          | string
          | undefined;
        return {
          taskId: Property.Dropdown({
            displayName: 'Task',
            required: true,
            refreshers: [],
            options: async () => {
              if (!auth || !listId)
                return {
                  disabled: true,
                  options: [],
                  placeholder: 'Select a task list first',
                };
              return await microsoftTodoCommon.getTasksInListDropdown(
                auth as OAuth2PropertyValue,
                listId
              );
            },
          }),
        };
      },
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const { listId, taskId } = propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
    const endpoint = `/me/todo/lists/${listId}/tasks/${taskId}`;
    await client.api(endpoint).delete();
    return {
      success: true,
    };
  },
});
