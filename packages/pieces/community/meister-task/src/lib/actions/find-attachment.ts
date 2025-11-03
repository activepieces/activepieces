import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const findAttachment = createAction({
    auth: meisterTaskAuth,
    name: 'find_attachment',
    displayName: 'Find Attachment',
    description: 'Finds an attachment on a task by its name (case-insensitive). Returns the first match.',
    props: {
        project_id: meisterTaskProps.projectId(true),
        task_id: meisterTaskProps.taskId(true),
        name: Property.ShortText({
            displayName: 'Attachment Name',
            description: 'The name (or partial name) of the attachment to find (e.g., "mockup.png").',
            required: true,
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the action will fail if no attachment matches the name.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { task_id, name, fail_if_not_found } = context.propsValue;
        const client = new MeisterTaskClient(context.auth.access_token);
        const searchName = (name as string).toLowerCase();

        const attachments = await client.getAttachments(task_id as number);
        const foundAttachment = attachments.find(att => 
            att.name.toLowerCase().includes(searchName)
        );

        if (foundAttachment) {
            return foundAttachment;
        }
        if (fail_if_not_found) {
            throw new Error(`Attachment containing "${name}" not found on task ${task_id}.`);
        }
        return null; 
    },
});