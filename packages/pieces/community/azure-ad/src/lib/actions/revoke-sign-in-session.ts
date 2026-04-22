import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, userDropdown } from '../common';

export const revokeSignInSessionAction = createAction({
    auth: azureAdAuth,
    name: 'revoke_sign_in_session',
    displayName: 'Revoke Sign-in Session',
    description: 'Revokes all refresh tokens for the user, forcing them to sign in again.',
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { userId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions?view=graph-rest-1.0&tabs=http
        const result = await callGraphApi<{ value?: boolean }>(token, {
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}/revokeSignInSessions`,
        });
        return { success: result.value ?? true, message: 'Sign-in sessions revoked.' };
    },
});
