import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';

export const addAttachment = createAction({
  auth: microsoftToDoAuth,
  name: 'addAttachment',
  displayName: 'Add Attachment',
  description: 'Adds an attachment to a Microsoft To Do task.',
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
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the file to attach.',
      required: true,
    }),
    file_content: Property.File({
      displayName: 'File Content',
      description: 'The file to attach.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { task_list_id, task_id, file_name, file_content } = propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });

    // Step 1: Create upload session
    const uploadSession = await client
      .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}/attachments/createUploadSession`)
      .post({
        attachmentInfo: {
          attachmentType: 'file',
          name: file_name,
          size: file_content.data.length,
        },
      });

    // Step 2: Upload the file in a single PUT request (for small files)
    await fetch(uploadSession.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': file_content.data.length.toString(),
        'Content-Range': `bytes 0-${file_content.data.length - 1}/${file_content.data.length}`,
      },
      body: Buffer.isBuffer(file_content.data)
        ? new Uint8Array(file_content.data)
        : new Uint8Array(Buffer.from(file_content.data)),
    });

    // Step 3: Return the upload session response
    return uploadSession;
  },
});