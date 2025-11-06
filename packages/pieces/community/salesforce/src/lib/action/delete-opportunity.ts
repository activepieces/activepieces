import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const deleteOpportunity = createAction({
    auth: salesforceAuth,
    name: 'delete_opportunity',
    displayName: 'Delete Opportunity',
    description: 'Deletes an opportunity.',
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