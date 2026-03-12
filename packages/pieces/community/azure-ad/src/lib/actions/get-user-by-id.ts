import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser, userDropdown } from '../common';

export const getUserByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_user_by_id',
    displayName: 'Get User by ID',
    description: 'Retrieves an Azure AD user by object ID or user principal name.',
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = (context.auth as { access_token: string }).access_token;
        const { userId } = context.propsValue;
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return flattenUser(user);
    },
});
