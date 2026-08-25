import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../auth';
import { leadDeleteDropdownProp } from '../common/props';

export const deleteLeadAction = createAction({
    auth: hunterAuth,
    name: 'delete-lead',
    displayName: 'Delete Lead',
    description: 'Delete a specific lead record by ID.',
    audience: 'both',
    aiMetadata: { description: 'Permanently deletes a single lead from the Hunter account by its lead ID. Use to remove a prospect that is no longer relevant. Requires the lead ID; idempotent in effect since re-deleting an already-removed lead leaves the account in the same state.', idempotent: true },
    props: {
        lead_id: leadDeleteDropdownProp,
    },
    async run(context) {
        const { lead_id } = context.propsValue;

        await hunterApiCall({
            apiKey: context.auth,
            endpoint: `/leads/${lead_id}`,
            method: HttpMethod.DELETE,
        });

        return { success: true };
    },
});
