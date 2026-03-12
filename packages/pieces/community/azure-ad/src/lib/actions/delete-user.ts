import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, userDropdown } from '../common';

export const deleteUserAction = createAction({
    auth: azureAdAuth,
    name: 'delete_user',
    displayName: 'Delete User',
    description: 'Deletes a user from Azure Active Directory.',
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { userId } = context.propsValue;
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return { success: true, message: 'User deleted.' };
    },
});
