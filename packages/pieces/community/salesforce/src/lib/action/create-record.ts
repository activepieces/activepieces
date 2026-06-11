import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createRecord = createAction({
    auth: salesforceAuth,
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Create a record of a given object.',
    audience: 'both',
    aiMetadata: { description: 'Create a new Salesforce record of any standard or custom object (Account, Contact, Lead, etc.) by supplying the object API name plus a JSON map of field values. Pick this for the general "insert one record" case; use Create Object (Advanced) only when you need the raw API response envelope rather than the record body. Not idempotent: each call inserts a new record with a new Id, so re-running creates duplicates.', idempotent: false },
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