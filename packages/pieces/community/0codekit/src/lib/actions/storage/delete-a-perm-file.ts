import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const deleteAPermFileAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'delete_a_perm_file',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete a Perm File',
    description: 'Permanently remove a file from 0CodeKit permanent storage.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently delete a file, identified by its file_id, from permanent storage in the connected 0CodeKit account. Its download link stops working and the file cannot be recovered. Fails if the file no longer exists.',
        idempotent: false,
    },
    props: {
        fileId: zeroCodeKitStorage.permFileId({
            description: 'The perm file to delete.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.deletedPermFile,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DeletePermFileResponse>({
            apiKey: auth.secret_text,
            path: '/storage/perm/del',
            body: {
                fileId: propsValue.fileId,
            },
        });
        return {
            deleted: true,
            file_id: propsValue.fileId,
            message: response.message ?? null,
        };
    },
});

type DeletePermFileResponse = {
    message?: string;
};
