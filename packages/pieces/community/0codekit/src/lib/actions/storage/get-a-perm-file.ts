import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitFiles } from '../../common/files';
import { zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const getAPermFileAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_a_perm_file',
    classification: 'READ',
    displayName: 'Get a Perm File',
    description: 'Get a file from 0CodeKit permanent storage so later steps can use it.',
    audience: 'both',
    aiMetadata: {
        description:
            'Fetch a file, identified by its file_id, from permanent storage in the connected 0CodeKit account. Returns its download url and, unless Link Only is on, also downloads the file and returns a file reference usable by later steps. Read-only and safe to retry. The vendor marks this endpoint as deprecated in favour of the url returned when the file was added.',
        idempotent: true,
    },
    props: {
        fileId: zeroCodeKitStorage.permFileId({
            description: 'The perm file to get.',
        }),
        linkOnly: Property.Checkbox({
            displayName: 'Link Only',
            description: 'Turn on to return only the download link without downloading the file.',
            required: false,
            defaultValue: false,
        }),
    },
    outputSchema: filesStorageOutputSchemas.permFile,
    async run({ auth, propsValue, files }) {
        const response = await zeroCodeKitApi.post<GetPermFileResponse>({
            apiKey: auth.secret_text,
            path: '/storage/perm/get',
            body: {
                fileId: propsValue.fileId,
                getAsUrl: true,
            },
        });
        const url = response.url;
        if (typeof url !== 'string' || url === '') {
            throw new Error('0CodeKit did not return a download link for this file.');
        }
        if (propsValue.linkOnly) {
            return { file_id: propsValue.fileId, url };
        }
        const data = await zeroCodeKitStorage.download(url);
        const fileName = zeroCodeKitStorage.fileNameFromUrl({ url, fallback: propsValue.fileId });
        const saved = await zeroCodeKitFiles.save({ files, fileName, data });
        return { file_id: propsValue.fileId, url, ...saved };
    },
});

type GetPermFileResponse = {
    url?: string;
};
