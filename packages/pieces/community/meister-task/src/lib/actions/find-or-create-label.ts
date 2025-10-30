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
        color: Property.ShortText({
            displayName: 'Color (Hex)',
            description: 'The hex color code (e.g., "#FF5533"). Only used if the label needs to be created.',
            required: true,
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
