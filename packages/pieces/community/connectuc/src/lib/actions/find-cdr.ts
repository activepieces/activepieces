import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall, getUserId } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCdrAction = createAction({
    auth: connectucAuth,
    name: 'find-cdr',
    displayName: 'Find CDR',
    description: 'Find a Call Detail Record (CDR) by original call ID',
    props: {
        origCallid: Property.ShortText({
            displayName: 'Original Call ID',
            description: 'The original call ID (origCallid) to search for',
            required: true,
        }),
    },
    async run(context) {
        const { origCallid } = context.propsValue;

        try {
            // Get user ID from OAuth2 token
            const userId = await getUserId(context.auth.access_token);

            // Make API call to find CDR by origCallid
            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${userId}/cdrs/${origCallid}`,
                method: HttpMethod.GET,
            });

            return response;
        } catch (error: unknown) {
            // Provide helpful error message
            const err = error as { response?: { body?: { message?: string } }; message?: string };
            const errorMessage = err.response?.body?.message || err.message || 'Unknown error occurred';
            throw new Error(`Failed to find CDR: ${errorMessage}`);
        }
    },
});
