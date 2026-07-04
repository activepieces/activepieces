import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser, userDropdown } from '../common';

export const updateUserAction = createAction({
    auth: azureAdAuth,
    name: 'update_user',
    displayName: 'Update User',
    description: 'Updates an Azure AD user. Only provide fields you want to change.',
    audience: 'both',
    aiMetadata: {
        description:
            'Updates profile fields (display name, given name/surname, job title, mail, mobile phone, accountEnabled) on an existing Azure AD user; only the supplied fields change, and at least one is required. Idempotent — re-applying the same values leaves the same state. Also the way to disable or re-enable sign-in via accountEnabled without deleting the account.',
        idempotent: true,
    },
    props: {
        userId: userDropdown,
        displayName: Property.ShortText({
            displayName: 'Display Name',
            required: false,
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
        accountEnabled: Property.Checkbox({
            displayName: 'Account Enabled',
            required: false,
        }),
    },
    async run(context) {
        const token = context.auth.access_token;
        const props = context.propsValue;
        const userId = props.userId;
        const body: Record<string, unknown> = {};
        if (props['displayName'] !== undefined && props['displayName'] !== '') body['displayName'] = props['displayName'];
        if (props['givenName'] !== undefined && props['givenName'] !== '') body['givenName'] = props['givenName'];
        if (props['surname'] !== undefined && props['surname'] !== '') body['surname'] = props['surname'];
        if (props['jobTitle'] !== undefined && props['jobTitle'] !== '') body['jobTitle'] = props['jobTitle'];
        if (props['mail'] !== undefined && props['mail'] !== '') body['mail'] = props['mail'];
        if (props['mobilePhone'] !== undefined && props['mobilePhone'] !== '') body['mobilePhone'] = props['mobilePhone'];
        if (props['accountEnabled'] !== undefined) body['accountEnabled'] = props['accountEnabled'];
        if (Object.keys(body).length === 0) {
            throw new Error('Provide at least one field to update.');
        }
        // https://learn.microsoft.com/en-us/graph/api/user-update?view=graph-rest-1.0&tabs=http
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
            body,
        });
        // https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return flattenUser(user);
    },
});
