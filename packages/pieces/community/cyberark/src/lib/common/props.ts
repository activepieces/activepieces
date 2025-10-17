import { Property, InputPropertyMap, StaticPropsValue } from '@activepieces/pieces-framework';
import { cyberarkAuth, CyberArkAuth } from './auth';
import { CyberArkClient } from './client';

export const cyberarkProps = {
    userId: (required = true) => Property.Dropdown({
        displayName: 'User',
        description: 'The user to select.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect your account first', options: [] };
            const client = new CyberArkClient(auth as unknown as CyberArkAuth);
            const users = await client.getUsers();
            return {
                disabled: false,
                options: users.map((user) => ({
                    label: user.username,
                    value: user.id,
                })),
            };
        },
    }),

    /**
     * A dynamic dropdown to select a user by their username.
     */
    username: (required = true) => Property.Dropdown({
        displayName: 'Username',
        description: 'The username of the Vault user to add.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect your account first', options: [] };
            const client = new CyberArkClient(auth as unknown as CyberArkAuth);
            const users = await client.getUsers();
            return {
                disabled: false,
                options: users.map((user) => ({
                    label: user.username,
                    value: user.username,
                })),
            };
        },
    }),
    
    /**
     * A dynamic dropdown to select a group.
     */
    groupId: (required = true) => Property.Dropdown({
        displayName: 'Group',
        description: 'The group to which the member will be added.',
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, placeholder: 'Connect your account first', options: [] };
            const client = new CyberArkClient(auth as unknown as CyberArkAuth);
            const groups = await client.getGroups();
            return {
                disabled: false,
                options: groups.map((group) => ({
                    label: group.groupName,
                    value: group.id,
                })),
            };
        },
    }),

    userType: () => Property.StaticDropdown({
        displayName: 'User Type',
        description: 'The type of user to create.',
        required: false,
        options: {
            disabled: false,
            options: [
                { label: 'EPV User', value: 'EPVUser' },
            ],
        },
        defaultValue: 'EPVUser',
    }),
    authenticationMethod: () => Property.StaticMultiSelectDropdown({
        displayName: 'Authentication Method',
        description: 'Specifies the authentication methods for the user.',
        required: false,
        options: {
            disabled: false,
            options: [
                { label: 'CyberArk Authentication', value: 'AuthTypePass' },
                { label: 'LDAP Authentication', value: 'AuthTypeLDAP' },
                { label: 'RADIUS Authentication', value: 'AuthTypeRADIUS' },
            ],
        },
        defaultValue: ['AuthTypePass'],
    }),
    vaultAuthorization: () => Property.DynamicProperties({
        displayName: 'Vault Authorizations',
        description: 'A list of authorizations for the user within the vault.',
        required: true,
        refreshers: [],
        props: async (propsValue): Promise<InputPropertyMap> => {
            const auth = propsValue['auth'] as StaticPropsValue<typeof cyberarkAuth.props>;
            if (!auth) {
                return {};
            }
            const staticAuthorizations = [
                { label: 'Add Safes', value: 'AddSafes' },
                { label: 'Audit Users', value: 'AuditUsers' },
                { label: 'Add/Update Users', value: 'AddUpdateUsers' },
                { label: 'Reset Users\' Passwords', value: 'ResetUsersPasswords' },
            ];
            return {
                authorizations: Property.StaticMultiSelectDropdown({
                    displayName: 'Authorizations',
                    required: false,
                    options: {
                        disabled: false,
                        options: staticAuthorizations,
                    },
                }),
            };
        },
    }),
};