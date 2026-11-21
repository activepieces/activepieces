import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, flattenedUserFields, flattenUser, userDropdown } from '../common';

export const getUserByIdAction = createAction({
    auth: azureAdAuth,
    name: 'get_user_by_id',
    classification: 'READ',
    displayName: 'Get User by ID',
    description: 'Gets a Microsoft Entra ID user by ID or user principal name.',
    audience: 'both',
    aiMetadata: {
        description:
            'Retrieves a single Microsoft Entra ID user profile by object ID or user principal name. Read-only and idempotent; use it to verify a user exists or fetch their details before update, license, or delete operations. Use Find Users when you only know an email, a partial name or another attribute.',
        idempotent: true,
    },
    outputSchema: { fields: flattenedUserFields },
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { userId } = context.propsValue;
        const user = await callGraphApi<Record<string, unknown>>(token, {
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return flattenUser(user);
    },
});
