import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, stripODataKeys, userDropdown } from '../common';

export const setUserAccountEnabledAction = createAction({
    auth: azureAdAuth,
    name: 'set_user_account_enabled',
    classification: 'WRITE',
    displayName: 'Enable or Disable User',
    description: 'Blocks or allows sign-in for a user without deleting the account.',
    audience: 'both',
    aiMetadata: {
        description:
            'Blocks ("disable") or allows ("enable") sign-in for one Microsoft Entra ID user by setting accountEnabled; the account and its data are kept. Disabling does not end sessions that are already open: also call Revoke Sign-in Session to cut them off immediately. Disabling an administrator needs a privileged role on the signed-in account. Idempotent: setting the same state again changes nothing. Returns the user\'s id, displayName, userPrincipalName and accountEnabled after the change.',
        idempotent: true,
    },
    outputSchema: {
        fields: [
            { key: 'id', label: 'User ID' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
            { key: 'accountEnabled', label: 'Account Enabled', format: 'boolean' },
        ],
    },
    props: {
        userId: userDropdown,
        state: Property.StaticDropdown({
            displayName: 'Sign-in',
            required: true,
            display: 'cards',
            options: {
                disabled: false,
                options: [
                    { label: 'Enable', value: 'enable', description: 'Allow the user to sign in' },
                    { label: 'Disable', value: 'disable', description: 'Block the user from signing in' },
                ],
            },
        }),
    },
    async run(context) {
        const { userId, state } = context.propsValue;
        const id = String(userId ?? '').trim();
        if (id === '') throw new Error('Select the user.');
        if (state !== 'enable' && state !== 'disable') {
            throw new Error('Sign-in must be "enable" or "disable".');
        }
        const url = `/users/${encodeURIComponent(id)}`;
        await callGraphApi(context.auth.access_token, {
            method: HttpMethod.PATCH,
            url,
            body: { accountEnabled: state === 'enable' },
        });
        const result = await callGraphApi<Record<string, unknown>>(context.auth.access_token, {
            method: HttpMethod.GET,
            url,
            query: { $select: 'id,displayName,userPrincipalName,accountEnabled' },
        });
        return stripODataKeys(result);
    },
});
