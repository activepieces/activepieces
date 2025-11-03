import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";
import { OAuth2PropertyValue } from "@activepieces/pieces-framework";

export const addLabelToTask = createAction({
    auth: meisterTaskAuth,
    name: 'add_label_to_task', 
    displayName: 'Add Label to Task', 
    description: 'Adds an existing label to a specific task.',
    props: {
        project_id: meisterTaskProps.projectId(true),
        task_id: meisterTaskProps.taskId(true),
        label_id: meisterTaskProps.labelId(true),
    },
    async run(context) {
        const { task_id, label_id } = context.propsValue;
        const client = new MeisterTaskClient(context.auth.access_token);
        const body = {
            label_id: label_id, 
        };
        return await client.makeRequest(
            HttpMethod.POST,
            `/tasks/${task_id}/labels`,
            body
        );
    },
});