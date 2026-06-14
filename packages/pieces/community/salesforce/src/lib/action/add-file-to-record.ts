import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const addFileToRecord = createAction({
    auth: salesforceAuth,
    name: 'add_file_to_record',
    displayName: 'Add File to Record',
    description: 'Uploads a file and attaches it to an existing record.',
    audience: 'both',
    aiMetadata: { description: 'Upload a file and attach it to an existing Salesforce record by creating a ContentVersion linked to the target record Id. Use when you need to attach a document, image, or other binary to a record. Not idempotent: each call creates a new file version, so re-running attaches a duplicate file.', idempotent: false },
    props: {
        object: salesforcesCommon.object,
        record_id: salesforcesCommon.record,
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload.',
            required: true,
        }),
        file_name: Property.ShortText({
            displayName: 'File Name',
            description: 'The name of the file, including its extension (e.g., "report.pdf").',
            required: true,
        })
    },
    async run(context) {
        const { record_id, file, file_name } = context.propsValue;

        const body = {
            Title: file_name,
            PathOnClient: file_name,
            VersionData: file.base64,
            FirstPublishLocationId: record_id, 
        };

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            '/services/data/v56.0/sobjects/ContentVersion',
            body
        );

        return response.body;
    },
});