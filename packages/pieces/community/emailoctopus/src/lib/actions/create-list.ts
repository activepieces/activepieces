import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";

export const createList = createAction({
    auth: emailOctopusAuth,
    name: 'create_list',
    displayName: 'Create List',
    description: 'Creates a new mailing list.',
    audience: 'both',
    aiMetadata: { description: 'Creates a new EmailOctopus mailing list with the given name. Use to set up a fresh list before adding contacts. Requires only a list name. Not idempotent — each call creates a separate list even if the name matches an existing one.', idempotent: false },
    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            description: 'The name for the new list.',
            required: true,
        }),
    },

    async run(context) {
        const { name } = context.propsValue;
        const client = new EmailOctopusClient(context.auth.secret_text);

        const body = {
            name,
        };

        
        return await client.makeRequest(
            HttpMethod.POST,
            `/lists`,
            body
        );
    },
});