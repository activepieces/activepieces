import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitFiles } from '../../common/files';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const addTemporaryFileAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'add_temporary_file',
    classification: 'WRITE',
    displayName: 'Add a Temporary File and Recieve a URL',
    description: 'Upload a file and get a public download link that expires after 24 hours.',
    audience: 'both',
    aiMetadata: {
        description:
            'Upload a file to 0CodeKit temporary storage and return a public download URL. Anyone with the URL can download the file, and it is deleted automatically after 24 hours. Each call uploads a new copy and returns a new URL, so it is not idempotent.',
        idempotent: false,
    },
    props: {
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload.',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            description: 'The uploaded file name, with extension. Empty keeps the original.',
            required: false,
            placeholder: 'report.pdf',
        }),
    },
    outputSchema: filesStorageOutputSchemas.temporaryFile,
    async run({ auth, propsValue }) {
        const fileName = (propsValue.fileName ?? '').trim() || propsValue.file.filename;
        const response = await zeroCodeKitApi.post<TemporaryFileResponse>({
            apiKey: auth.secret_text,
            path: '/storage/temp',
            body: {
                buffer: zeroCodeKitFiles.toBase64(propsValue.file),
                fileName,
            },
        });
        return {
            url: response.url ?? null,
            file_name: response.fileName ?? fileName ?? null,
        };
    },
});

type TemporaryFileResponse = {
    url?: string;
    fileName?: string;
};
