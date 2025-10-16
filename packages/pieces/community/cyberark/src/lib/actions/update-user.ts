import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { cyberarkAuth, CyberArkAuth } from "../common/auth";
import { CyberArkClient } from "../common/client";
import { cyberarkProps } from "../common/props";

export const updateUser = createAction({
    name: 'update_user',
    displayName: 'Update User',
    description: 'Updates an existing user in the Vault.',
    auth: cyberarkAuth,
    props: {
        userId: cyberarkProps.userId(),
        username: Property.ShortText({
            displayName: 'Username',
            description: "The user's username. Must be included even if not changing.",
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: "The user's new primary email address.",
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A new short description for the user account.',
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
        enableUser: Property.Checkbox({
            displayName: 'Enable User',
            description: 'If checked, the user will be enabled. If unchecked, they will be disabled.',
            required: false,
        }),
        passwordNeverExpires: Property.Checkbox({
            displayName: 'Password Never Expires',
            description: 'If checked, the user\'s password will not expire.',
            required: false,
        }),
        changePassOnNextLogon: Property.Checkbox({
            displayName: 'Change Password on Next Logon',
            description: 'If checked, the user must change their password on the next login.',
            required: false,
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const client = new CyberArkClient(auth);
        const userId = String(propsValue['userId']);


        const currentUserDetails = await client.getUserDetails(userId);


        const payload = { ...currentUserDetails };


        if (propsValue['username'] !== undefined) payload.username = propsValue['username'];
        if (propsValue['description'] !== undefined) payload.description = propsValue['description'];
        if (propsValue['userType'] !== undefined) payload.userType = propsValue['userType'];
        if (propsValue['authenticationMethod'] !== undefined) payload.authenticationMethod = propsValue['authenticationMethod'];
        if (propsValue['vaultAuthorizations'] !== undefined) payload.vaultAuthorization = propsValue['vaultAuthorizations'];
        if (propsValue['enableUser'] !== undefined) payload.enableUser = propsValue['enableUser'];
        if (propsValue['passwordNeverExpires'] !== undefined) payload.passwordNeverExpires = propsValue['passwordNeverExpires'];
        if (propsValue['changePassOnNextLogon'] !== undefined) payload.changePassOnNextLogon = propsValue['changePassOnNextLogon'];


        if (propsValue['email'] !== undefined) {
            if (!payload.internet) payload.internet = {};
            payload.internet.businessEmail = propsValue['email'];
        }


        return await client.makeRequest(
            HttpMethod.PUT,
            `/PasswordVault/API/Users/${userId}`,
            payload
        );
    },
});