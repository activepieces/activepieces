import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const deleteOpportunity = createAction({
    auth: salesforceAuth,
    name: 'delete_opportunity',
    displayName: 'Delete Opportunity',
    description: 'Deletes an opportunity.',
    audience: 'both',
    aiMetadata: { description: 'Delete a single Opportunity by its ID. Destructive and irreversible; not idempotent, since deleting an already-removed Opportunity errors. For other object types use the generic Delete Record.', idempotent: false },
    props: {
        opportunity_id: salesforcesCommon.opportunity,
    },
    async run(context) {
        const { opportunity_id } = context.propsValue;

        await callSalesforceApi(
            HttpMethod.DELETE,
            context.auth,
            `/services/data/v56.0/sobjects/Opportunity/${opportunity_id}`,
            undefined
        );

        return {
            success: true,
        };
    },
});