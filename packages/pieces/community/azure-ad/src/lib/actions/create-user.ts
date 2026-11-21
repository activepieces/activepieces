import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenedUserFields, flattenUser } from '../common';

export const createUserAction = createAction({
    auth: azureAdAuth,
    name: 'create_user',
    classification: 'WRITE',
    displayName: 'Create User',
    description: 'Creates a new user in Microsoft Entra ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Provisions a new Microsoft Entra ID user with a unique user principal name, initial password, and optional profile fields; set usageLocation if licenses will be assigned afterwards. Not idempotent — a retry fails on the duplicate UPN rather than updating the account. Use Update User to change an existing user instead.',
        idempotent: false,
    },
    outputSchema: { fields: flattenedUserFields },
    propertyGroups: [
        { key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['givenName', 'surname'] },
    ],
    props: {
        displayName: Property.ShortText({
            displayName: 'Display Name',
            description: 'The name displayed in the address book for the user.',
            required: true,
            placeholder: 'Ada Lovelace',
        }),
        userPrincipalName: Property.ShortText({
            displayName: 'User Principal Name',
            description: 'The sign-in name (UPN), e.g. ada@contoso.onmicrosoft.com.',
            required: true,
            placeholder: 'ada@contoso.onmicrosoft.com',
        }),
        mailNickname: Property.ShortText({
            displayName: 'Mail Nickname',
            description: 'The mail alias for the user (local part, no @domain).',
            required: true,
            placeholder: 'ada',
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description:
                'Initial password for the user. Must satisfy your tenant password policy.',
            required: true,
            placeholder: 'At least 8 chars, mixed',
        }),
        forceChangePasswordNextSignIn: Property.Checkbox({
            displayName: 'Force Password Change on Next Sign-in',
            description: 'If enabled, the user must change their password at first sign-in.',
            required: false,
            advanced: true,
            defaultValue: true,
        }),
        accountEnabled: Property.Checkbox({
            displayName: 'Account Enabled',
            description: 'Whether the user can sign in.',
            required: false,
            advanced: true,
            defaultValue: true,
        }),
        givenName: Property.ShortText({
            displayName: 'Given Name',
            width: 'half',
            required: false,
            placeholder: 'Jane',
        }),
        surname: Property.ShortText({
            displayName: 'Surname',
            width: 'half',
            required: false,
            placeholder: 'Doe',
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            required: false,
            placeholder: 'Sales Manager',
            advanced: true,
        }),
        mail: Property.ShortText({
            displayName: 'Mail',
            description: 'Primary SMTP address.',
            required: false,
            placeholder: 'jane@contoso.com',
            advanced: true,
        }),
        mobilePhone: Property.ShortText({
            displayName: 'Mobile Phone',
            required: false,
            placeholder: '+1 555 0100',
            advanced: true,
        }),
        usageLocation: Property.ShortText({
            displayName: 'Usage Location',
            description:
                'Two-letter ISO 3166 country code (e.g. "US"). Required before assigning licenses.',
            required: false,
            placeholder: 'US',
            advanced: true,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const props = context.propsValue;

        const body: Record<string, unknown> = {
            accountEnabled: props.accountEnabled ?? true,
            displayName: props.displayName,
            userPrincipalName: props.userPrincipalName,
            mailNickname: props.mailNickname,
            passwordProfile: {
                password: props.password,
                forceChangePasswordNextSignIn: props.forceChangePasswordNextSignIn ?? true,
            },
        };
        if (props.givenName) body['givenName'] = props.givenName;
        if (props.surname) body['surname'] = props.surname;
        if (props.jobTitle) body['jobTitle'] = props.jobTitle;
        if (props.mail) body['mail'] = props.mail;
        if (props.mobilePhone) body['mobilePhone'] = props.mobilePhone;
        if (props.usageLocation) body['usageLocation'] = props.usageLocation;

        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: 'https://graph.microsoft.com/v1.0/users',
            body,
        });
        return flattenUser(user);
    },
});
