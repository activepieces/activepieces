import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createRecord = createAction({
    auth: salesforceAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Create a record of a given object.',
    props: {
        object: salesforcesCommon.object,
        data: Property.Json({
            displayName: 'Record Data',
            description: 'Enter the fields for the new record as a JSON object. For example: {"Name": "My New Account", "Industry": "Technology"}',
            required: true,
            defaultValue: {},
        }),
    },
    async run(context) {
        const { object, data } = context.propsValue;

        if (!object) {
            throw new Error('Object is not defined. Please select an object.');
        }

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            `/services/data/v56.0/sobjects/${object}`,
            data as Record<string, unknown>
        );

        return response.body;
    },
});