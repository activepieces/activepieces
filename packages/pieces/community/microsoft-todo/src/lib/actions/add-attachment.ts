import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { TaskFileAttachment } from '@microsoft/microsoft-graph-types';
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
        file: Property.File({
            displayName: 'File',
            description: 'The file to attach (up to 25 MB supported).',
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

        if (!task_list_id || !task_id) {
            throw new Error('Task List ID and Task ID are required');
        }

        if (!file || !file.data) {
            throw new Error('File or file data is missing. Please provide a valid file.');
        }

        const fileSizeInBytes = file.data.length;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        const attachmentName = filename || file.filename;

        if (fileSizeInMB > 25) {
            throw new Error(`File size (${fileSizeInMB.toFixed(2)} MB) exceeds the 25 MB limit.`);
        }

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        try {
            if (fileSizeInMB < 3) {
                const attachmentBody = {
                    '@odata.type': '#microsoft.graph.taskFileAttachment',
                    name: attachmentName,
                    contentBytes: file.data.toString('base64'),
                    contentType: file.extension ? `application/${file.extension}` : 'application/octet-stream',
                };

                const response = await client
                    .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}/attachments`)
                    .post(attachmentBody);

                return response as TaskFileAttachment;
            }

            const uploadSession = await client
                .api(`/me/todo/lists/${task_list_id}/tasks/${task_id}/attachments/createUploadSession`)
                .post({
                    attachmentInfo: {
                        attachmentType: 'file',
                        name: attachmentName,
                        size: fileSizeInBytes,
                    },
                });

            const uploadUrl = uploadSession.uploadUrl;
            const chunkSize = 4 * 1024 * 1024;
            let uploadedBytes = 0;

            while (uploadedBytes < fileSizeInBytes) {
                const chunkEnd = Math.min(uploadedBytes + chunkSize, fileSizeInBytes);
                const chunk = file.data.slice(uploadedBytes, chunkEnd);
                const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${fileSizeInBytes}`;

                const uploadResponse = await client
                    .api(uploadUrl)
                    .headers({
                        'Content-Length': chunk.length.toString(),
                        'Content-Range': contentRange,
                        'Content-Type': 'application/octet-stream',
                    })
                    .put(chunk);

                uploadedBytes = chunkEnd;

                if (uploadedBytes >= fileSizeInBytes) {
                    return uploadResponse as TaskFileAttachment;
                }
            }

            throw new Error('Upload completed but no response received');
        } catch (error: any) {
            throw new Error(`Failed to add attachment: ${error?.message || error}`);
        }
    },
});