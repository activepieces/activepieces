import { createAction, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall, getUserId } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCdrAction = createAction({
    auth: connectucAuth,
    name: 'update-cdr',
    displayName: 'Update CDR',
    description: 'Update a Call Detail Record (CDR) in ConnectUC',
    audience: 'both',
    aiMetadata: { description: 'Updates the notes on an existing Call Detail Record (CDR) for the authenticated user, setting a required note plus optional disposition and reason. Use when an agent needs to annotate a known call with an outcome or comment; requires the CDR ID. Idempotent: it overwrites the same fields on the identified CDR, so repeating the call with the same input yields the same final state.', idempotent: true },
    props: {
        cdrId: Property.ShortText({
            displayName: 'CDR ID',
            description: 'The ID of the CDR to update',
            required: true,
        }),
        note: Property.LongText({
            displayName: 'Note',
            description: 'Note about the call',
            required: true,
        }),
        disposition: Property.ShortText({
            displayName: 'Disposition',
            description: 'The call disposition or outcome',
            required: false,
        }),
        reason: Property.ShortText({
            displayName: 'Reason',
            description: 'The reason for the call outcome',
            required: false,
        }),
    },
    async run(context) {
        const { cdrId, note, disposition, reason } = context.propsValue;

        try {
            const userId = await getUserId(context.auth.access_token);

            const body: Record<string, unknown> = {
                note,
            };

            if (disposition !== undefined && disposition !== null && disposition !== '') {
                body['disposition'] = disposition;
            }
            if (reason !== undefined && reason !== null && reason !== '') {
                body['reason'] = reason;
            }

            const response = await connectucApiCall({
                accessToken: context.auth.access_token,
                endpoint: `/users/${userId}/call/${cdrId}/notes`,
                method: HttpMethod.PUT,
                body,
            });

            return response;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to update CDR: ${message}`);
        }
    },
});
