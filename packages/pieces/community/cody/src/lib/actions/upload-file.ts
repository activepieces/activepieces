import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { folderIdDropdown } from '../common/props';
import mime from 'mime-types';

export const uploadFileAction = createAction({
    auth: codyAuth,
    name: 'upload_file',
    displayName: 'Upload File to Knowledge Base',
    description: 'Add a file directly into a specific folder in the knowledge base.',
    props: {
        folder_id: folderIdDropdown,
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload (e.g., txt, md, rtf, pdf, ppt, docx).',
            required: true,
        })
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
            message: `File '${file.filename}' uploaded successfully and is being processed.`
        };
    },
});