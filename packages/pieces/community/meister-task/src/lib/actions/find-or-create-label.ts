import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient, MeisterTaskLabel } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const findOrCreateLabel = createAction({
    auth: meisterTaskAuth,
    name: 'find_or_create_label',
    displayName: 'Find or Create Label',
    description: 'Finds a label by name. If not found, a new one will be created.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        name: Property.ShortText({
            displayName: 'Label Name',
            description: 'The name of the label to find or create (e.g., "Urgent").',
            required: true,
        }),
        
        color: Property.StaticDropdown({
            displayName: 'Color (if creating)',
            description: 'Select a predefined color for the label (only used if the label needs to be created).',
            required: true,
            defaultValue: "d93651",
            options: {
                options: [
                    { label: "Red", value: "d93651" },
                    { label: "Orange", value: "ff9f1a" },
                    { label: "Yellow", value: "ffd500" },
                    { label: "Grass Green", value: "8acc47" },
                    { label: "Moss Green", value: "47cc8a" },
                    { label: "Turquoise", value: "30bfbf" },
                    { label: "Blue", value: "00aaff" },
                    { label: "Purple", value: "8f7ee6" },
                    { label: "Grey", value: "98aab3" },
                ]
            }
        }),
    },

    async run(context) {
        const { project_id, name, color } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);
        const labelName = name as string;
        const labelColor = color as string;

        const foundLabels = await client.findLabelsByName(project_id as number, labelName);
        const exactMatch = foundLabels.find(label =>
            label.name.toLowerCase() === labelName.toLowerCase()
        );

        if (exactMatch) {
            return {
                status: "found",
                label: exactMatch
            };
        }

        const createBody = {
            name: labelName,
            color: labelColor,
        };

        const newLabel = await client.makeRequest<MeisterTaskLabel>(
            HttpMethod.POST,
            `/projects/${project_id}/labels`,
            createBody
        );

        return {
            status: "created",
            label: newLabel
        };
    },
});
