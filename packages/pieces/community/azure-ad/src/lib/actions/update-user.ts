import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser } from '../common';

export const updateUserAction = createAction({
    auth: azureAdAuth,
    name: 'update_user',
    displayName: 'Update User',
    description: 'Updates an Azure AD user. Only provide fields you want to change.',
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'The object ID or user principal name of the user to update.',
            required: true,
        }),
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
        const token = (context.auth as { access_token: string }).access_token;
        const props = context.propsValue;
        const userId = props.userId;
        const body: Record<string, unknown> = {};
        if (props['displayName'] !== undefined && props['displayName'] !== '') body['displayName'] = props['displayName'];
        if (props['givenName'] !== undefined && props['givenName'] !== '') body['givenName'] = props['givenName'];
        if (props['surname'] !== undefined && props['surname'] !== '') body['surname'] = props['surname'];
        if (props['jobTitle'] !== undefined && props['jobTitle'] !== '') body['jobTitle'] = props['jobTitle'];
        if (props['mail'] !== undefined && props['mail'] !== '') body['mail'] = props['mail'];
        if (props['mobilePhone'] !== undefined) body['mobilePhone'] = props['mobilePhone'];
        if (props['accountEnabled'] !== undefined) body['accountEnabled'] = props['accountEnabled'];
        if (Object.keys(body).length === 0) {
            return { success: false, message: 'No fields to update were provided.' };
        }
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}`,
            body,
        });
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}`,
        });
        return flattenUser(user);
    },
});
