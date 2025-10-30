import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, AuthenticationType, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { meisterTaskApiUrl, MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";
import FormData from "form-data";

export const findOrCreateAttachment = createAction({
    auth: meisterTaskAuth,
    name: 'find_or_create_attachment',
    displayName: 'Find or Create Attachment',
    description: "Finds an attachment on a task by its name. If not found, uploads the new file.",

    props: {
        project_id: meisterTaskProps.projectId(true),
        task_id: meisterTaskProps.taskId(true),
        file: Property.File({
            displayName: 'File',
            description: 'The file to find or upload. The filename will be used as the search key.',
            required: true,
        }),
    },

    async run(context) {
        const { task_id, file } = context.propsValue;
        const filename = file.filename;
        const client = new MeisterTaskClient(context.auth);

        const attachments = await client.getAttachments(task_id as number);
        const foundAttachment = attachments.find(att =>
            att.name.toLowerCase() === filename.toLowerCase()
        );

        if (foundAttachment) {
            return {
                status: "found",
                attachment: foundAttachment
            };
        }

        const formData = new FormData();
        formData.append('file', file.data, file.filename);

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
            }
        };

        const response = await httpClient.sendRequest(request);

        return {
            status: "created",
            attachment: response.body
        };
    },
});
