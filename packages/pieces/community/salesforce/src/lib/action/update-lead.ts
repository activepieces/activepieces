import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const updateLead = createAction({
    auth: salesforceAuth,
    name: 'update_lead',
    displayName: 'Update Lead',
    description: 'Update an existing lead.',
    props: {
        lead_id: salesforcesCommon.lead,
        data: Property.Json({
            displayName: 'Data to Update',
            description: 'Enter the fields to update as a JSON object. For example: {"Company": "New Corp", "Status": "Working - Contacted"}',
            required: true,
            defaultValue: {},
        }),
    },
    async run(context) {
        const { lead_id, data } = context.propsValue;

        await callSalesforceApi(
            HttpMethod.PATCH,
            context.auth,
            `/services/data/v56.0/sobjects/Lead/${lead_id}`,
            data as Record<string, unknown>
        );

        return {
            success: true,
        };
    },
});