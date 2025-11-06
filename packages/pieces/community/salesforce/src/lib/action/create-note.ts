import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createNote = createAction({
    auth: salesforceAuth,
    name: 'create_note',
    displayName: 'Create Note',
    description: 'Creates a note and attaches it to a record.',
    props: {
        object: salesforcesCommon.object,
        parent_id: salesforcesCommon.record, 
        Title: Property.ShortText({
            displayName: 'Title',
            required: true,
        }),
        Body: Property.LongText({
            displayName: 'Body',
            description: 'The content of the note.',
            required: true,
        }),
    },
    async run(context) {
        const { parent_id, Title, Body } = context.propsValue;

        const body = {
            ParentId: parent_id,
            Title: Title,
            Body: Body,
        };

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/Note',
            body
        );

        return response.body;
    },
});