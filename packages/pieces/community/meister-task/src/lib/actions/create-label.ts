import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
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
        color: Property.StaticDropdown({
            displayName: 'Color',
            description: 'Select a predefined color for the label.',
            required: true,
            defaultValue: "d93651", 
            options: {
                options: [
                    { label: "Red", value: "d93651" }, { label: "Orange", value: "ff9f1a" },
                    { label: "Yellow", value: "ffd500" }, { label: "Grass Green", value: "8acc47" },
                    { label: "Moss Green", value: "47cc8a" }, { label: "Turquoise", value: "30bfbf" },
                    { label: "Blue", value: "00aaff" }, { label: "Purple", value: "8f7ee6" },
                    { label: "Grey", value: "98aab3" },
                ]
            }
        }),
    },
    async run(context) {
        const { project_id, name, color } = context.propsValue;
        const client = new MeisterTaskClient(context.auth.access_token);
        const body = { name, color };
        return await client.makeRequest(
            HttpMethod.POST,
            `/projects/${project_id}/labels`,
            body
        );
    },
});