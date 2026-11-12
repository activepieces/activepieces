import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';
import { sobjectCreateResponseOutputSchema } from '../output-schemas';

export const createAttachment = createAction({
    auth: salesforceAuth,
    name: 'create_attachment',
    classification: 'WRITE',
    displayName: 'Create Legacy Attachment',
    description: 'Creates a classic attachment. For new work, use Add File to Record.',
    audience: 'both',
    aiMetadata: { description: 'Attach a file to a record using the legacy Attachment object (single parent, no sharing). Prefer modern Files/ContentDocument when available; this is for older orgs or when a classic Attachment is specifically required. Not idempotent — repeated calls create duplicate attachments.', idempotent: false },
    outputSchema: sobjectCreateResponseOutputSchema,
    propertyGroups: [
        { key: 'record', display: 'section', label: 'Record', icon: 'file', props: ['object', 'parent_id'] },
        { key: 'file', display: 'section', label: 'File', icon: 'paperclip', props: ['file', 'file_name'] },
    ],
    props: {
        object: salesforcesCommon.object,
        parent_id: salesforcesCommon.record, 
        file: Property.File({
            displayName: 'File',
            required: true,
        }),
        file_name: Property.ShortText({
            displayName: 'File Name',
            description: 'Include the extension.',
            required: true,
            placeholder: 'report.pdf',
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