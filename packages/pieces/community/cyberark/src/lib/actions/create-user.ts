import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth, CyberArkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";
import { cyberarkProps } from "../common/props";

export const createUser = createAction({
    name: 'create_user',
    displayName: 'Create User',
    description: 'Creates a new user in the CyberArk Vault.',
    auth: cyberarkAuth,
    props: {
        username: Property.ShortText({
            displayName: 'Username',
            description: 'The unique name for the new user.',
            required: true,
        }),
        initialPassword: Property.ShortText({
            displayName: 'Initial Password',
            description: 'The initial password for the user. Must comply with the password policy.',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The user\'s email address.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A short description for the user account.',
            required: false,
        }),
        userType: cyberarkProps.userType(),
        authenticationMethod: cyberarkProps.authenticationMethod(),
        vaultAuthorizations: Property.MultiSelectDropdown({
            displayName: 'Vault Authorizations',
            description: 'A list of authorizations for the user within the vault.',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Connect your account first', options: [] };
                const client = new CyberArkClient(auth as unknown as CyberArkAuth);
                const authorizations = await client.getVaultAuthorizations();
                return {
                    disabled: false,
                    options: authorizations,
                };
            },
        }),
        passwordNeverExpires: Property.Checkbox({
            displayName: 'Password Never Expires',
            description: 'If set to true, the user\'s password will not expire.',
            required: false,
            defaultValue: false,
        }),
        changePassOnNextLogon: Property.Checkbox({
            displayName: 'Change Password on Next Logon',
            description: 'If set to true, the user must change their password on first login.',
            required: false,
            defaultValue: true,
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);

        const requestBody = {
            username: propsValue['username'],
            initialPassword: propsValue['initialPassword'],
            email: propsValue['email'],
            description: propsValue['description'],
            userType: propsValue['userType'],
            authenticationMethod: propsValue['authenticationMethod'],
            vaultAuthorization: propsValue['vaultAuthorizations'],
            passwordNeverExpires: propsValue['passwordNeverExpires'],
            changePassOnNextLogon: propsValue['changePassOnNextLogon'],
        };
        
        return await client.makeRequest(
            HttpMethod.POST,
            '/PasswordVault/API/Users',
            requestBody
        );
    },
});