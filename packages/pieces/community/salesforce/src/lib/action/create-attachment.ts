import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const createAttachment = createAction({
    auth: salesforceAuth,
    name: 'create_attachment',
    displayName: 'Create Attachment (Legacy)',
    description: 'Creates a legacy Attachment record. Salesforce recommends using "Add File to Record" for modern apps.',
    props: {
        object: salesforcesCommon.object,
        parent_id: salesforcesCommon.record, 
        file: Property.File({
            displayName: 'File',
            description: 'The file to attach.',
            required: true,
        }),
        file_name: Property.ShortText({
            displayName: 'File Name',
            description: 'The name of the file, including its extension (e.g., "attachment.pdf").',
            required: true,
        })
    },
    async run(context) {
        const { parent_id, file, file_name } = context.propsValue;

        const body = {
            ParentId: parent_id,
            Name: file_name,
            Body: file.base64,
        };

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/Attachment',
            body
        );

        return response.body;
    },
});