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
        const token = context.auth.access_token;
        const { userId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/user-delete?view=graph-rest-1.0&tabs=http
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return { success: true, message: 'User deleted.' };
    },
});
