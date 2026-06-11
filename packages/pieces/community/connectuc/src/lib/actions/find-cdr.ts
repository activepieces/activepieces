import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall, getUserId } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCdrAction = createAction({
    auth: connectucAuth,
    name: 'find-cdr',
    displayName: 'Find CDR',
    description: 'Find a Call Detail Record (CDR) by original call ID',
    audience: 'both',
    aiMetadata: { description: 'Looks up a single Call Detail Record (CDR) for the authenticated user by its original call ID (origCallid). Use when an agent has a call ID and needs that call\'s details, such as before updating its notes. Idempotent: it is a read-only lookup that does not modify anything.', idempotent: true },
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
            const userId = await getUserId(context.auth.access_token);

            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${userId}/cdrs/${origCallid}`,
                method: HttpMethod.GET,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to find CDR: ${message}`);
        }
    },
});
