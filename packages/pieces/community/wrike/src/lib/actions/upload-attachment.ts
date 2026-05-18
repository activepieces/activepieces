import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const uploadAttachment = createAction({
    name: 'upload_attachment',
    displayName: 'Upload Attachment',
    description: 'Upload a file and attach it to a task or folder',
    auth: wrikeAuth,
    props: {
        entityType: Property.StaticDropdown({
            displayName: 'Entity Type',
            description: 'Select whether to attach the file to a task or folder',
            required: true,
            options: {
                options: [
                    { label: 'Task', value: 'tasks' },
                    { label: 'Folder', value: 'folders' },
                ],
            },
        }),
        entityId: Property.ShortText({
            displayName: 'Entity ID',
            description: 'The ID of the task or folder to attach the file to',
            required: true,
        }),
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload and attach',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            description: 'Optional custom name for the uploaded file',
            required: false,
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { entityType, entityId, file, fileName } = props;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${wrikeCommon.baseUrl}/${entityType}/${entityId}/attachments`,
            body: file.data,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Requested-With': 'XMLHttpRequest',
                'X-File-Name': fileName || file.filename,
            },
        });

        return response.body;
    },
});
