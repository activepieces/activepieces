import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const createUserAction = createAction({
    auth: azureAdAuth,
    name: 'create_user',
    displayName: 'Create User',
    description: 'Creates a new user in Microsoft Entra ID.',
    props: {
        displayName: Property.ShortText({
            displayName: 'Display Name',
            description: 'The name displayed in the address book for the user.',
            required: true,
        }),
        userPrincipalName: Property.ShortText({
            displayName: 'User Principal Name',
            description: 'The sign-in name (UPN), e.g. ada@contoso.onmicrosoft.com.',
            required: true,
        }),
        mailNickname: Property.ShortText({
            displayName: 'Mail Nickname',
            description: 'The mail alias for the user (local part, no @domain).',
            required: true,
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description:
                'Initial password for the user. Must satisfy your tenant password policy.',
            required: true,
        }),
        forceChangePasswordNextSignIn: Property.Checkbox({
            displayName: 'Force Password Change on Next Sign-in',
            description: 'If enabled, the user must change their password at first sign-in.',
            required: false,
            defaultValue: true,
        }),
        accountEnabled: Property.Checkbox({
            displayName: 'Account Enabled',
            description: 'Whether the user can sign in.',
            required: false,
            defaultValue: true,
        }),
        givenName: Property.ShortText({
            displayName: 'Given Name',
            required: false,
        }),
        surname: Property.ShortText({
            displayName: 'Surname',
            required: false,
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            required: false,
        }),
        mail: Property.ShortText({
            displayName: 'Mail',
            description: 'Primary SMTP address.',
            required: false,
        }),
        mobilePhone: Property.ShortText({
            displayName: 'Mobile Phone',
            required: false,
        }),
        usageLocation: Property.ShortText({
            displayName: 'Usage Location',
            description:
                'Two-letter ISO 3166 country code (e.g. "US"). Required before assigning licenses.',
            required: false,
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

        // https://learn.microsoft.com/en-us/graph/api/user-post-users?view=graph-rest-1.0&tabs=http
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.POST,
            url: 'https://graph.microsoft.com/v1.0/users',
            body,
        });
        return flattenUser(user);
    },
});
