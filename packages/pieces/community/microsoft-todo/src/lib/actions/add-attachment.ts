import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { microsoftTodoCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const addAttachmentAction = createAction({
  auth: microsoftToDoAuth,
  name: 'add_attachment',
  displayName: 'Add an Attachment to Task',
  description: 'Adds a file attachment to an existing task.',

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
    file: Property.File({
      displayName: 'Attachment',
      description: 'The file to attach to the task.',
      required: true,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const { listId, taskId, file } = propsValue;
    const fileData = file as { filename: string; base64: string };
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
    const endpoint = `/me/todo/lists/${listId}/tasks/${taskId}/attachments`;
    const requestBody = {
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: fileData.filename,
      contentBytes: fileData.base64,
    };
    const response = await client.api(endpoint).post(requestBody);
    return response;
  },
});
