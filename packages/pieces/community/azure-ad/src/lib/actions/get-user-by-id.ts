import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenUser, userDropdown } from '../common';

export const getUserByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_user_by_id',
    displayName: 'Get User by ID',
    description: 'Retrieves an Azure AD user by object ID or user principal name.',
    audience: 'both',
    aiMetadata: {
        description:
            'Retrieves a single Azure AD user profile by object ID or user principal name. Read-only and idempotent; use it to verify a user exists or fetch their details before update, license, or delete operations. Use List Users when you only know a partial name or other attribute.',
        idempotent: true,
    },
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { userId } = context.propsValue;
        // https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return flattenUser(user);
    },
});
