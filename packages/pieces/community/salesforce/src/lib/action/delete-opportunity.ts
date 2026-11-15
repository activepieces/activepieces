import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { successOutputSchema } from '../output-schemas';

export const deleteOpportunity = createAction({
    auth: salesforceAuth,
    name: 'delete_opportunity',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Opportunity',
    description: 'Deletes an opportunity. It goes to the Recycle Bin.',
    audience: 'human',
    aiMetadata: { description: 'Delete a single Opportunity by its ID. Destructive and irreversible; not idempotent, since deleting an already-removed Opportunity errors. For other object types use the generic Delete Record.', idempotent: false },
    outputSchema: successOutputSchema,
    props: {
        recycle_info: Property.MarkDown({
            value: 'Deleted records go to the Recycle Bin, where they can be restored.',
            variant: MarkdownVariant.INFO,
        }),
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