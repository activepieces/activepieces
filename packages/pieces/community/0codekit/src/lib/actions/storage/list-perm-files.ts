import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const listPermFilesAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'list_perm_files',
    classification: 'SEARCH',
    displayName: 'List Perm Files',
    description: 'Get every file in your 0CodeKit permanent storage and how much space is left.',
    audience: 'both',
    aiMetadata: {
        description:
            'List all files in permanent storage for the connected 0CodeKit account, each with file_id, file_name, download url and size in KiB, plus the remaining storage in KiB and the total count. Takes no input. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {},
    outputSchema: filesStorageOutputSchemas.permFileList,
    async run({ auth }) {
        const response = await zeroCodeKitStorage.listPermFiles(auth.secret_text);
        const permFiles = response.files ?? [];
        return {
            count: permFiles.length,
            available_storage_kib: response.availableStorage ?? null,
            files: permFiles.map(zeroCodeKitStorage.toPermFile),
        };
    },
});
