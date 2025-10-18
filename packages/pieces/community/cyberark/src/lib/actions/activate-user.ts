import { createAction } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const activateUser = createAction({
    auth: cyberarkAuth,
    name: 'activate_user',
    displayName: 'Activate User',
    description: 'Activates a suspended user in CyberArk',
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
                `/Users/${userId}/activate`,
                HttpMethod.POST
            );

            return {
                success: true,
                message: `User ${userId} activated successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to activate user ${userId}`
            );
        }
    },
});
