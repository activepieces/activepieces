import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import mime from 'mime-types';

export const uploadFileToKbAction = createAction({
    auth: codyAuth,
    name: 'upload_file_to_kb',
    displayName: 'Upload File to Knowledge Base (AI)',
    description: 'Upload a binary file into a Cody knowledge-base folder.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Uploads a binary file (e.g. txt, md, rtf, pdf, ppt, docx) into a Cody knowledge-base folder and registers it as a document. Use when ingesting an existing file rather than inline text (use Create Text Document) or a web page (use Create Document From Webpage). Resolve the folder ID first via List Folders. This is a composite operation (mint a signed upload URL, PUT the bytes to storage, then register the document); ingestion is asynchronous, so poll Get Document for status. Requires a folder ID and the file; creates a new document each call, so it is not idempotent.',
        idempotent: false,
    },
    props: {
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to upload the file into. Resolve via List Folders.',
            required: true,
        }),
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload (e.g., txt, md, rtf, pdf, ppt, docx).',
            required: true,
        }),
    },
    async run(context) {
        const { folder_id, file } = context.propsValue;
        const apiKey = context.auth;

        // Step 1: Determine Content-Type from filename using the mime-types library
        const contentType = mime.lookup(file.filename) || 'application/octet-stream';

        // Step 2: Get a Signed URL from the Cody API
        const { url: signedUrl, key } = await codyClient.getSignedUrl(
            apiKey,
            file.filename,
            contentType
        );

        // Step 3: Upload the actual file data to the signed URL
        await codyClient.uploadFileToS3(signedUrl, file.data, contentType);

        // Step 4: Finalize the document creation in Cody
        await codyClient.createDocumentFromFile(apiKey, folder_id, key);

        return {
            success: true,
            message: `File '${file.filename}' uploaded successfully and is being processed.`,
        };
    },
});
