// src/lib/actions/delete-client.ts

import { createAction } from "@activepieces/pieces-framework";
// 👇 Import the necessary types
import { simplybookMeAuth, SimplybookMeAuthData } from "../common/auth";
import { SimplybookMeClient } from "../common/client";
import { simplybookMeProps } from "../common/props";

export const deleteClient = createAction({
    auth: simplybookMeAuth,
    name: 'delete_client',
    displayName: 'Delete a Client',
    description: 'Deletes one or more existing client records.',
    props: {
        clients: simplybookMeProps.clientId(),
    },

    async run(context) {
        const { clients } = context.propsValue;
        
        if (!clients || clients.length === 0) {
            throw new Error("You must select at least one client to delete.");
        }

        const clientIds = (clients as string[]).map(id => parseInt(id, 10));

        const params = [
            clientIds
        ];

        // 👇 FIX: Revert to the simple client constructor
        const client = new SimplybookMeClient(context.auth as SimplybookMeAuthData);
        
        return await client.makeRpcRequest('deleteUsers', params);
    },
});