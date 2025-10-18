import { createAction } from '@activepieces/pieces-framework';
import { cyberarkAuth } from '../common/auth';
import { createCyberArkClient } from '../common/client';
import { userIdDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const enableUser = createAction({
    auth: cyberarkAuth,
    name: 'enable_user',
    displayName: 'Enable User',
    description: 'Enables a disabled user in CyberArk',
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
                { disabled: false }
            );

            return {
                success: true,
                message: `User ${userId} enabled successfully`,
                data: response,
            };
        } catch (error) {
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Failed to enable user ${userId}`
            );
        }
    },
});
