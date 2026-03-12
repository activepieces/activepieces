import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

export const revokeSignInSessionAction = createAction({
    auth: azureAdAuth,
    name: 'revoke_sign_in_session',
    displayName: 'Revoke Sign-in Session',
    description: 'Revokes all refresh tokens for the user, forcing them to sign in again.',
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'The object ID or user principal name of the user.',
            required: true,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { userId } = context.propsValue;
        const result = await callGraphApi<{ value?: boolean }>(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}/revokeSignInSessions`,
        });
        return { success: result.value ?? true, message: 'Sign-in sessions revoked.' };
    },
});
