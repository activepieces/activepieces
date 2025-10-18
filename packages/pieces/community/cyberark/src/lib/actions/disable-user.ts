import { createAction } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const disableUser = createAction({
    auth: cyberarkAuth,
    name: 'disable_user',
    displayName: 'Disable User',
    description: 'Disables a user in CyberArk',
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
            const response = await client.makeRequest(
                `/Users/${userId}`,
                HttpMethod.PUT,
                { disabled: true }
            );

            return {
                success: true,
                message: `User ${userId} disabled successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to disable user ${userId}`
            );
        }
    },
});
