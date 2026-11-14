import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { connectucApiCall, getUserId } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCdrAction = createAction({
    auth: connectucAuth,
    name: 'update-cdr',
    classification: 'WRITE',
    displayName: 'Update Call Record',
    description: 'Set the note, disposition and reason on a call record.',
    audience: 'both',
    aiMetadata: { description: 'Updates the notes on an existing Call Detail Record (CDR) for the authenticated user, setting a required note plus optional disposition and reason. Use when an agent needs to annotate a known call with an outcome or comment; requires the CDR ID. Idempotent: it overwrites the same fields on the identified CDR, so repeating the call with the same input yields the same final state.', idempotent: true },
    propertyGroups: [
        { key: 'call', display: 'section', label: 'Call Record', icon: 'text', props: ['cdrId', 'note'] },
        { key: 'outcome', display: 'section', label: 'Outcome', icon: 'sliders', props: ['outcome_info', 'disposition', 'reason'] },
    ],
    props: {
        cdrId: Property.ShortText({
            displayName: 'Call Record ID',
            description: 'The ID from a New Call Record trigger.',
            required: true,
        }),
        note: Property.LongText({
            displayName: 'Note',
            required: true,
        }),
        outcome_info: Property.MarkDown({
            value: 'Leave Disposition and Reason empty to keep their current values.',
            variant: MarkdownVariant.INFO,
        }),
        disposition: Property.ShortText({
            displayName: 'Disposition',
            placeholder: 'Resolved',
            width: 'half',
            required: false,
        }),
        reason: Property.ShortText({
            displayName: 'Reason',
            placeholder: 'Callback requested',
            width: 'half',
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
