import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";
import { cyberarkProps } from "../common/props";

export const deleteUser = createAction({
    name: 'delete_user',
    displayName: 'Delete User',
    description: 'Deletes an existing user from the Vault.',
    auth: cyberarkAuth,
    props: {
        userId: cyberarkProps.userId(),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);

        const userId = String(propsValue['userId']);

        return await client.makeRequest(
            HttpMethod.DELETE,
            `/PasswordVault/API/Users/${userId}`
        );
    },
});