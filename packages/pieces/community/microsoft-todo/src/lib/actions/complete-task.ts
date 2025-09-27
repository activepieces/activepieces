import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTodoCommon } from '../common';

export const completeTaskAction = createAction({
  auth: microsoftToDoAuth,
  name: 'complete_task',
  displayName: 'Complete Task',
  description: 'Marks an existing task as completed in a list.',
  props: {
    listId: Property.DynamicProperties({
      displayName: 'Task List',
      required: true,
      refreshers: [],
      props: async (context) => {
        const auth = context['auth'];
        const listId = Property.Dropdown({
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
        });
        return { listId };
      },
    }),
    taskId: Property.DynamicProperties({
      displayName: 'Task',
      required: true,
      refreshers: ['listId'],
      props: async (context) => {
        const auth = context['auth'];
        const propsValue = context['propsValue'];
        const listId = propsValue['listId'] as unknown as string | undefined;
        const taskId = Property.Dropdown({
          displayName: 'Task',
          required: true,
          refreshers: [],
          options: async () => {
            if (!auth)
              return {
                disabled: true,
                options: [],
                placeholder: 'Connect your account first',
              };
            return await microsoftTodoCommon.getTasksInListDropdown(
              auth as OAuth2PropertyValue,
              listId ?? ''
            );
          },
        });
        return { taskId };
      },
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const listId = propsValue['listId'];
    const taskId = propsValue['taskId'];
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
    const endpoint = `/me/todo/lists/${listId}/tasks/${taskId}`;
    const response = await client.api(endpoint).patch({
      status: 'completed',
    });
    return response;
  },
});
