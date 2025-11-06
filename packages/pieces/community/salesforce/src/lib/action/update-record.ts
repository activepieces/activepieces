import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const updateRecord = createAction({
    auth: salesforceAuth,
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Updates an existing record.',
    props: {
        object: salesforcesCommon.object,
        record_id: salesforcesCommon.record,
        data: Property.Json({
            displayName: 'Data to Update',
            description: 'Enter the fields to update as a JSON object. For example: {"BillingCity": "San Francisco"}',
            required: true,
            defaultValue: {},
        }),
    },
    async run(context) {
        const { object, record_id, data } = context.propsValue;

        if (!object) {
            throw new Error('Object is not defined. Please select an object.');
        }

        await callSalesforceApi(
            HttpMethod.PATCH,
            context.auth,
            `/services/data/v56.0/sobjects/${object}/${record_id}`,
            data as Record<string, unknown>
        );

        return {
            success: true,
        };
    },
});