import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitFiles } from '../../common/files';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const addAPermFileAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'add_a_perm_file',
    classification: 'WRITE',
    displayName: 'Add a Perm File',
    description: 'Upload a file to 0CodeKit permanent storage and get a lasting download link.',
    audience: 'both',
    aiMetadata: {
        description:
            'Upload a file to permanent storage in the connected 0CodeKit account, either from a file or from a public URL, and return its file_id and a permanent download url. Provide exactly one of File or File URL. Each call stores a new copy and uses storage quota, so do not retry blindly.',
        idempotent: false,
    },
    props: {
        file: Property.File({
            displayName: 'File',
            description: 'The file to upload. Leave empty if you use File URL instead.',
            required: false,
        }),
        fileUrl: Property.ShortText({
            displayName: 'File URL',
            description: 'A public link to the file to upload. Used only when File is empty.',
            required: false,
        }),
        uploadName: Property.ShortText({
            displayName: 'File Name',
            description: 'The download name, with extension. Empty keeps the original name.',
            required: false,
            placeholder: 'invoice.pdf',
        }),
    },
    outputSchema: filesStorageOutputSchemas.addedPermFile,
    async run({ auth, propsValue }) {
        const { file } = propsValue;
        const fileUrl = (propsValue.fileUrl ?? '').trim();
        if (!file && fileUrl === '') {
            throw new Error('Provide either a File or a File URL.');
        }
        const uploadName = (propsValue.uploadName ?? '').trim() || file?.filename;
        const response = await zeroCodeKitApi.post<AddPermFileResponse>({
            apiKey: auth.secret_text,
            path: '/storage/perm/add',
            body: file
                ? { fileBuffer: zeroCodeKitFiles.toBase64(file), uploadName }
                : { fileUrl, uploadName },
        });
        return {
            file_id: response.fileId,
            url: response.url,
            file_name: uploadName ?? null,
        };
    },
});

type AddPermFileResponse = {
    fileId: string;
    url: string;
};
