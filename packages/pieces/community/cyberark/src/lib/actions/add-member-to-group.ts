import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";
import { cyberarkProps } from "../common/props";

export const addMemberToGroup = createAction({
    name: 'add_member_to_group',
    displayName: 'Add Member to Group',
    description: 'Adds a user to an existing Vault group.',
    auth: cyberarkAuth,
    props: {
        groupId: cyberarkProps.groupId(),
        memberId: cyberarkProps.username(),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);
        
        const groupId = propsValue['groupId'];
        const memberId = propsValue['memberId'];

        const requestBody = {
            memberId: memberId,
            memberType: 'vault',
        };

        return await client.makeRequest(
            HttpMethod.POST,
            `/PasswordVault/API/Groups/${groupId}/Members`,
            requestBody
        );
    },
});