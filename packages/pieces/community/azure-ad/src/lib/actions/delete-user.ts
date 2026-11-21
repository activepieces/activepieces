import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, userDropdown } from '../common';

export const deleteUserAction = createAction({
    auth: azureAdAuth,
    name: 'delete_user',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete User',
    description: 'Deletes a user from Microsoft Entra ID.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently deletes a Microsoft Entra ID user account by object ID or user principal name. Destructive and not idempotent — repeating the call fails with 404 after the first success. If the removal may need to be reversed, prefer Enable or Disable User to block sign-in instead. Deleted users stay restorable from deleted items for 30 days.',
        idempotent: false,
    },
    outputSchema: {
        fields: [
            { key: 'success', label: 'Success', format: 'boolean' },
            { key: 'message', label: 'Message' },
            { key: 'id', label: 'Deleted User ID' },
        ],
    },
    props: {
        userId: userDropdown,
    },
    async run(context) {
        const token = context.auth.access_token;
        const { userId } = context.propsValue;
        await callGraphApi(token, {
            method: HttpMethod.DELETE,
            url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(String(userId))}`,
        });
        return { success: true, message: 'User deleted.', id: userId };
    },
});
