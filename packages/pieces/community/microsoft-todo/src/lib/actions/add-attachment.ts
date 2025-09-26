import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const addAttachmentAction = createAction({
    auth: microsoftToDoAuth,
    name: 'add_attachment',
    displayName: 'Add an Attachment',
    description: 'Adds an attachment to a task.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            description: 'The task list that contains the task.',
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
            description: 'The task to which you are adding the attachment.',
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
        file: Property.File({
            displayName: 'File',
            description: 'The file to attach (must be under 3MB).',
            required: true,
        }),
        filename: Property.ShortText({
            displayName: 'Attachment Name (Optional)',
            description: 'The name to display for the attachment. If left blank, the original filename will be used.',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, task_id, file, filename } = propsValue;

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const attachmentBody = {
            '@odata.type': '#microsoft.graph.taskFileAttachment',
            name: filename || file.filename,
            contentBytes: file.data,

            contentType: 'application/octet-stream',
        };

        const response = await client
            .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}/attachments`)
            .post(attachmentBody);

        return response;
    },
});