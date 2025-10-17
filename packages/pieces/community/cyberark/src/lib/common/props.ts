import { Property } from '@activepieces/pieces-framework';
import { createCyberArkClient } from './client';
import { CyberArkAuth } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const userIdDropdown = Property.Dropdown({
    displayName: 'User',
    description: 'Select a user',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const client = createCyberArkClient(auth as CyberArkAuth);
            const response = await client.makeRequest<{ Users: Array<{ id: number; username: string; source: string }> }>(
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
                    label: `${user.username} (${user.source})`,
                    value: user.id.toString(),
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error fetching users',
            };
        }
    },
});

export const groupIdDropdown = Property.Dropdown({
    displayName: 'Group',
    description: 'Select a group',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const client = createCyberArkClient(auth as CyberArkAuth);
            const response = await client.makeRequest<{ value: Array<{ groupId: number; groupName: string }> }>(
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
                    value: group.groupId.toString(),
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error fetching groups',
            };
        }
    },
});

export const userSearchProps = {
    searchField: Property.StaticDropdown({
        displayName: 'Search Field',
        description: 'Field to search by',
        required: true,
        defaultValue: 'username',
        options: {
            disabled: false,
            options: [
                { label: 'Username', value: 'username' },
                { label: 'User Type', value: 'userType' },
                { label: 'Component User', value: 'componentUser' },
            ],
        },
    }),
    searchValue: Property.ShortText({
        displayName: 'Search Value',
        description: 'Value to search for',
        required: true,
    }),
};
