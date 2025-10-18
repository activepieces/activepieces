import { createAction, Property } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { groupIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { CyberArkAuth } from '../common/auth';

export const addMemberToGroup = createAction({
    auth: cyberarkAuth,
    name: 'add_member_to_group',
    displayName: 'Add Member to Group',
    description: 'Adds a member to a CyberArk group',
    props: {
        groupId: groupIdDropdown,
        memberType: Property.StaticDropdown({
            displayName: 'Member Type',
            description: 'Type of member',
            required: true,
            defaultValue: 'User',
            options: {
                disabled: false,
                options: [
                    { label: 'User', value: 'User' },
                    { label: 'Group', value: 'Group' },
                ],
            },
        }),
        memberName: Property.Dropdown({
            displayName: 'Member Name',
            description: 'Select member to add',
            required: true,
            refreshers: ['auth', 'memberType'],
            options: async ({ auth, memberType }) => {
                if (!auth || !memberType) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select member type first',
                    };
                }

                try {
                    const client = createCyberArkClient(auth as CyberArkAuth);

                    if (memberType === 'User') {
                        const response = await client.makeRequest<{ Users: Array<{ id: number; username: string }> }>(
                            '/Users',
                            HttpMethod.GET
                        );

                        if (!response.Users || response.Users.length === 0) {
                            return {
                                disabled: true,
                                options: [],
                                placeholder: 'No users found',
                            };
                        }

                        return {
                            disabled: false,
                            options: response.Users.map((user) => ({
                                label: user.username,
                                value: user.username,
                            })),
                        };
                    } else {
                        const response = await client.makeRequest<{ value: Array<{ groupName: string }> }>(
                            '/UserGroups',
                            HttpMethod.GET
                        );

                        if (!response.value || response.value.length === 0) {
                            return {
                                disabled: true,
                                options: [],
                                placeholder: 'No groups found',
                            };
                        }

                        return {
                            disabled: false,
                            options: response.value.map((group) => ({
                                label: group.groupName,
                                value: group.groupName,
                            })),
                        };
                    }
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error fetching members',
                    };
                }
            },
        }),
        domainName: Property.ShortText({
            displayName: 'Domain Name',
            description: 'Domain name',
            required: false,
        }),
    },
    async run(context) {
        const { groupId, memberType, memberName, domainName } = context.propsValue;

        if (!groupId || !memberType || !memberName) {
            throw new Error('Group ID, member type, and member name are required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            const memberData: any = {
                memberName,
                memberType,
            };

            if (domainName) {
                memberData.domainName = domainName;
            }

            const response = await client.makeRequest(
                `/UserGroups/${groupId}/Members`,
                HttpMethod.POST,
                memberData
            );

            return {
                success: true,
                message: `Member ${memberName} added to group successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to add member ${memberName} to group`
            );
        }
    },
});
