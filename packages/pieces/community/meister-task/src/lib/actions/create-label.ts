
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const createLabel = createAction({
    auth: meisterTaskAuth,
    name: 'create_label',
    displayName: 'Create Label',
    description: 'Creates a new label in a specific project.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        
        name: Property.ShortText({
            displayName: 'Label Name',
            description: 'The name of the new label (e.g., "Urgent").',
            required: true,
        }),
        color: Property.ShortText({
            displayName: 'Color (Hex)',
            description: 'The hex color code for the label (e.g., "#FF5533").',
            required: true,
        }),
    },

    async run(context) {
        const { project_id, name, color } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);

        const body = {
            name,
            color,
        };

        return await client.makeRequest(
            HttpMethod.POST,
            `/projects/${project_id}/labels`,
            body
        );
    },
});