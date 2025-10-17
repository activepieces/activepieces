import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";
import { cyberarkProps } from "../common/props";

export const removeUserFromGroup = createAction({
    name: 'remove_user_from_group',
    displayName: 'Remove User From Group',
    description: 'Removes an existing user from a Vault group.',
    auth: cyberarkAuth,
    props: {
        groupId: cyberarkProps.groupId(),
        memberName: cyberarkProps.username(),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);
        
        const groupId = propsValue['groupId'];
        const memberName = propsValue['memberName'];


        return await client.makeRequest(
            HttpMethod.DELETE,
            `/PasswordVault/api/UserGroups/${groupId}/Members/${memberName}`
        );
    },
});