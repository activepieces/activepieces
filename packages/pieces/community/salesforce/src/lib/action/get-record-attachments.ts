import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { querySalesforceApi, salesforcesCommon } from '../common';


interface QueryResult {
    records: any[];
}

export const getRecordAttachments = createAction({
    auth: salesforceAuth,
    name: 'get_record_attachments',
    displayName: 'Get Record Attachments',
    description: 'Get all attachments (both classic and modern Files) for a record.',
    props: {
        object: salesforcesCommon.object,
        record_id: salesforcesCommon.record,
    },
    async run(context) {
        const { record_id } = context.propsValue;


        const classicAttachmentsQuery = `SELECT Id, Name, BodyLength, ContentType FROM Attachment WHERE ParentId = '${record_id}'`;
        const classicAttachmentsResponse = await querySalesforceApi<QueryResult>(
            HttpMethod.GET,
            context.auth,
            classicAttachmentsQuery
        );
        const classicAttachments = classicAttachmentsResponse.body?.records || [];


        const filesQuery = `SELECT ContentDocument.Id, ContentDocument.Title FROM ContentDocumentLink WHERE LinkedEntityId = '${record_id}'`;
        const filesResponse = await querySalesforceApi<QueryResult>(
            HttpMethod.GET,
            context.auth,
            filesQuery
        );
        const files = filesResponse.body?.records || [];

        const allAttachments = {
            classic_attachments: classicAttachments,
            files: files.map((file: any) => ({
                Id: file.ContentDocument.Id,
                Title: file.ContentDocument.Title,
            })),
        };

        return allAttachments;
    },
});