import { createAction, Property, ActionContext } from '@activepieces/pieces-framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const updateRecord = createAction({
    name: 'update_record',
    displayName: 'Update Record',
    description: 'Update fields of an existing record',
    auth: knackAuth,
    props: {
        objectKey: Property.ShortText({
            displayName: 'Object Key',
            description: 'The key of the object/table containing the record',
            required: true,
        }),
        recordId: Property.ShortText({
            displayName: 'Record ID',
            description: 'The ID of the record to update',
            required: true,
        }),
        updateData: Property.Object({
            displayName: 'Update Data',
            description: 'The new data to update the record with',
            required: true,
        }),
    },
    async run(context: ActionContext) {
        const client = makeClient(context.auth);
        const response = await client.put(
            `/objects/${context.propsValue['objectKey']}/records/${context.propsValue['recordId']}`,
            {
                data: context.propsValue['updateData']
            }
        );
        
        return response.data;
    },
});
