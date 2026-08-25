import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const deleteRecord = createAction({
    auth: salesforceAuth,
    name: 'delete_record',
    displayName: 'Delete Record',
    description: 'Deletes an existing record in an object.',
    audience: 'both',
    aiMetadata: { description: 'Delete a single record of any object by its ID. Destructive and irreversible from here; not idempotent, since a repeat call on an already-deleted ID errors. Use this generic delete for objects without a dedicated one (Delete Opportunity exists separately).', idempotent: false },
    props: {
        object: salesforcesCommon.object,
        record_id: salesforcesCommon.record,
    },
    async run(context) {
        const { object, record_id } = context.propsValue;

        if (!object) {
            throw new Error('Object is not defined. Please select an object.');
        }

        await callSalesforceApi(
            HttpMethod.DELETE,
            context.auth,
            `/services/data/v56.0/sobjects/${object}/${record_id}`,
            undefined
        );

        return {
            success: true,
        };
    },
});