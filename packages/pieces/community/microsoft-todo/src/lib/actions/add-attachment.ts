import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';

export const addAttachmentAction = createAction({
    auth: microsoftToDoAuth,
    name: 'add_attachment',
    displayName: 'Add Attachment',
    description: 'Adds an attachment to a task.',
    props: {
        task_list_id: Property.Dropdown({
            displayName: 'Task List',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!(auth as OAuth2PropertyValue)?.access_token) {
                    return { disabled: true, placeholder: 'Connect your account first', options: [] };
                }
                return await getTaskListsDropdown(auth as OAuth2PropertyValue);
            },
        }),
        task_id: Property.Dropdown({
            displayName: 'Task',
            required: true,
            refreshers: ['task_list_id'],
            options: async ({ auth, task_list_id }) => {
                const authValue = auth as OAuth2PropertyValue;
                if (!authValue?.access_token || !task_list_id) {
                    return {
                        disabled: true,
                        placeholder: !authValue?.access_token ? 'Connect your account first' : 'Select a task list first',
                        options: [],
                    };
                }
                return await getTasksInListDropdown(authValue, task_list_id as string);
            },
        }),
        name: Property.ShortText({
            displayName: 'File Name',
            required: true,
        }),
        content_bytes: Property.LongText({
            displayName: 'Content (Base64)',
            description: 'Base64-encoded file content.',
            required: true,
        }),
        content_type: Property.ShortText({
            displayName: 'Content Type',
            description: 'MIME type, e.g. application/pdf',
            required: true,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { task_list_id, task_id, name, content_bytes, content_type } = propsValue;

        const client = Client.initWithMiddleware({
            authProvider: { getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token) },
        });

        const body = {
            '@odata.type': '#microsoft.graph.taskFileAttachment',
            name,
            contentType: content_type,
            contentBytes: content_bytes,
        };

        const response = await client
            .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}/attachments`)
            .post(body);

        return response;
    },
});


