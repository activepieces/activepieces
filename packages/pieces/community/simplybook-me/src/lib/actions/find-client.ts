
import { createAction, Property } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { SimplybookMeClient } from "../common/client";

export const findClient = createAction({
    auth: simplybookMeAuth,
    name: 'find_client',
    displayName: 'Find Client(s)',
    description: 'Finds clients by name, email, or phone number.',
    props: {
        searchString: Property.ShortText({
            displayName: 'Search Query',
            description: 'The name, email, or phone number to search for. Leave blank to retrieve all clients.',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Result Limit',
            description: 'The maximum number of clients to return.',
            required: false,
        }),
    },

    async run(context) {
        const { searchString, limit } = context.propsValue;
        
        const client = new SimplybookMeClient(context.auth);
        
        return await client.findClients(searchString ?? '', limit ?? null);
    },
});