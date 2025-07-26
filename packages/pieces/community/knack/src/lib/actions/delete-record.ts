import { createAction, Property, ActionContext } from '@activepieces/pieces-framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const deleteRecord = createAction({
    name: 'delete_record',
    displayName: 'Delete Record',
    description: 'Permanently delete a record from a table',
    auth: knackAuth,
    props: {
        objectKey: Property.ShortText({
            displayName: 'Object Key',
            description: 'The key of the object/table containing the record',
            required: true,
        }),
        recordId: Property.ShortText({
            displayName: 'Record ID',
            description: 'The ID of the record to delete',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth);
        const response = await client.delete(
            `/objects/${context.propsValue.objectKey}/records/${context.propsValue.recordId}`
        );
        
        return response.data;
    },
});
