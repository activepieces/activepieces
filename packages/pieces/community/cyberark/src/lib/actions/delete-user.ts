import { createAction } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteUser = createAction({
    auth: cyberarkAuth,
    name: 'delete_user',
    displayName: 'Delete User',
    description: 'Deletes a user from CyberArk',
    props: {
        userId: userIdDropdown,
    },
    async run(context) {
        const { userId } = context.propsValue;

        if (!userId) {
            throw new Error('User ID is required');
        }

        const client = createCyberArkClient(context.auth);

        try {
            await client.makeRequest(
                `/Users/${userId}`,
                HttpMethod.DELETE
            );

            return {
                success: true,
                message: `User ${userId} deleted successfully`,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to delete user ${userId}`
            );
        }
    },
});
