import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi } from '../common';

export const deleteUserAction = createAction({
    auth: azureAdAuth,
    name: 'delete_user',
    displayName: 'Delete User',
    description: 'Deletes a user from Azure Active Directory.',
    props: {
        userId: Property.ShortText({
            displayName: 'User ID',
            description: 'The object ID or user principal name (e.g. user@domain.com) of the user to delete.',
            required: true,
        }),
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { userId } = context.propsValue;
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userId)}`,
        });
        return { success: true, message: 'User deleted.' };
    },
});
