import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const findLabel = createAction({
    auth: meisterTaskAuth,
    name: 'find_label',
    displayName: 'Find Label',
    description: 'Finds a label in a project by its name (case-insensitive). Returns the first match.',
    props: {
        project_id: meisterTaskProps.projectId(true),
        name: Property.ShortText({
            displayName: 'Label Name',
            description: 'The name (or partial name) of the label to find (e.g., "Urgent").',
            required: true,
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the action will fail if no label matches the name.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { project_id, name, fail_if_not_found } = context.propsValue;
        const client = new MeisterTaskClient(context.auth.access_token);
        const searchName = (name as string).toLowerCase();

        const labels = await client.getLabels(project_id as number);
        const foundLabel = labels.find(label => 
            label.name.toLowerCase().includes(searchName)
        );

        if (foundLabel) {
            return foundLabel;
        }
        if (fail_if_not_found) {
            throw new Error(`Label containing "${name}" not found in project ${project_id}.`);
        }
        return null; 
    },
});