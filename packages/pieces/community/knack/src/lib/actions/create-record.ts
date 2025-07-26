import { createAction, Property, ActionContext } from '@activepieces/pieces-framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const createRecord = createAction({
    name: 'create_record',
    displayName: 'Create Record',
    description: 'Insert a new record into a specified object/table',
    auth: knackAuth,
    props: {
        objectKey: Property.ShortText({
            displayName: 'Object Key',
            description: 'The key of the object/table to create record in',
            required: true,
        }),
        recordData: Property.Object({
            displayName: 'Record Data',
            description: 'The data to create the record with',
            required: true,
        }),
    },
    async run(context: ActionContext<typeof knackAuth, typeof this.props>) {
        const client = makeClient(context.auth);
        const response = await client.post(`/objects/${context.propsValue['objectKey']}/records`, {
            data: context.propsValue['recordData']
        });
        
        return response.data;
    },
});
