import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, AuthenticationType, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { meisterTaskApiUrl } from "../common/client";
import { meisterTaskProps } from "../common/props";
import FormData from "form-data";

export const createAttachment = createAction({
    auth: meisterTaskAuth,
    name: 'create_attachment',
    displayName: 'Create Attachment',
    description: 'Creates a new attachment on a specific task.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        task_id: meisterTaskProps.taskId(true),
        
        file: Property.File({
            displayName: 'File',
            description: 'The file to attach.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name (Optional)',
            description: 'An optional new name for the attachment.',
            required: false,
        }),
    },

    async run(context) {
        const { task_id, file, name } = context.propsValue;

        const formData = new FormData();
        formData.append('file', file.data, file.filename);
        
        if (name) {
            formData.append('name', name as string);
        }

        const request: HttpRequest<FormData> = {
            method: HttpMethod.POST,
            url: `${meisterTaskApiUrl}/tasks/${task_id}/attachments`,
            body: formData, 
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth,
            },
            headers: {
                ...formData.getHeaders(),
                'User-Agent': 'ActivePieces'
            }
        };

        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});
