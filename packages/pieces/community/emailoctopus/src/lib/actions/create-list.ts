import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";

export const createList = createAction({
    auth: emailOctopusAuth,
    name: 'create_list',
    displayName: 'Create List',
    description: 'Creates a new mailing list.',
    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            description: 'The name for the new list.',
            required: true,
        }),
    },

    async run(context) {
        const { name } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        const body = {
            name,
        };

        // This calls the POST /lists endpoint.
        return await client.makeRequest(
            HttpMethod.POST,
            `/lists`,
            body
        );
    },
});