import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { groupIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { CyberArkAuth } from '../common/auth';

export const removeUserFromGroup = createAction({
    auth: cyberarkAuth,
    name: 'remove_user_from_group',
    displayName: 'Remove User From Group',
    description: 'Removes a user from a CyberArk group',
    props: {
        groupId: groupIdDropdown,
        memberName: Property.Dropdown({
            displayName: 'Member Name',
            description: 'Select member to remove',
            required: true,
            refreshers: ['auth', 'groupId'],
            options: async ({ auth, groupId }) => {
                if (!auth || !groupId) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select group first',
                    };
                }

                try {
                    const client = createCyberArkClient(auth as CyberArkAuth);
                    const response = await client.makeRequest<{ members: Array<{ memberName: string; memberType: string }> }>(
                        `/UserGroups/${groupId}/Members`,
                        HttpMethod.GET
                    );

                    if (!response.members || response.members.length === 0) {
                        return {
                            disabled: true,
                            options: [],
                            placeholder: 'No members found in this group',
                        };
                    }

                    return {
                        disabled: false,
                        options: response.members.map((member) => ({
                            label: `${member.memberName} (${member.memberType})`,
                            value: member.memberName,
                        })),
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error fetching group members',
                    };
                }
            },
        }),
    },
    async run(context) {
        const { groupId, memberName } = context.propsValue;

        if (!groupId || !memberName) {
            throw new Error('Group ID and member name are required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            await client.makeRequest(
                `/UserGroups/${groupId}/Members/${memberName}`,
                HttpMethod.DELETE
            );

            return {
                success: true,
                message: `User ${memberName} removed from group successfully`,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to remove user ${memberName} from group`
            );
        }
    },
});
