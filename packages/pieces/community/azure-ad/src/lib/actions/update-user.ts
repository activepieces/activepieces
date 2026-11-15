import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenedUserFields, flattenUser, userDropdown } from '../common';

export const updateUserAction = createAction({
    auth: azureAdAuth,
    name: 'update_user',
    classification: 'WRITE',
    displayName: 'Update User',
    description: 'Updates a Microsoft Entra ID user. Only filled-in fields change.',
    audience: 'both',
    aiMetadata: {
        description:
            'Updates profile fields (display name, given name/surname, job title, mail, mobile phone, sign-in) on an existing Microsoft Entra ID user; only the supplied fields change, and at least one is required. Idempotent — re-applying the same values leaves the same state. Prefer Enable or Disable User when the only change is blocking or allowing sign-in.',
        idempotent: true,
    },
    outputSchema: { fields: flattenedUserFields },
    props: {
        userId: userDropdown,
        displayName: Property.ShortText({
            displayName: 'Display Name',
            required: false,
            placeholder: 'Jane Doe',
        }),
        givenName: Property.ShortText({
            displayName: 'Given Name',
            required: false,
            placeholder: 'Jane',
        }),
        surname: Property.ShortText({
            displayName: 'Surname',
            required: false,
            placeholder: 'Doe',
        }),
        jobTitle: Property.ShortText({
            displayName: 'Job Title',
            required: false,
            placeholder: 'Sales Manager',
        }),
        mail: Property.ShortText({
            displayName: 'Mail',
            description: 'Primary SMTP address.',
            required: false,
            placeholder: 'jane@contoso.com',
        }),
        mobilePhone: Property.ShortText({
            displayName: 'Mobile Phone',
            required: false,
            placeholder: '+1 555 0100',
        }),
        accountEnabled: Property.StaticDropdown<string>({
            displayName: 'Sign-in',
            description: 'Leave empty to keep it as is.',
            required: false,
            advanced: true,
            options: {
                options: [
                    { label: 'Allow sign-in', value: 'yes' },
                    { label: 'Block sign-in', value: 'no' },
                ],
            },
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
        const accountEnabled = readAccountEnabled(props['accountEnabled']);
        if (accountEnabled !== undefined) body['accountEnabled'] = accountEnabled;
        if (Object.keys(body).length === 0) {
            throw new Error('Provide at least one field to update.');
        }
        await callGraphApi(token, {
            method: HttpMethod.PATCH,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
            body,
        });
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
            query: { $select: 'id,displayName,givenName,surname,userPrincipalName,mail,jobTitle,mobilePhone,officeLocation,preferredLanguage,businessPhones,accountEnabled' },
        });
        return flattenUser(user);
    },
});

function readAccountEnabled(value: unknown): boolean | undefined {
    if (value === 'yes' || value === true) return true;
    if (value === 'no') return false;
    return undefined;
}
