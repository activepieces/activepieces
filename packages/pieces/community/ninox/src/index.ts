import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { createRecord } from './lib/actions/create-record'
import { deleteRecord } from './lib/actions/delete-record'
import { downloadFileFromRecord } from './lib/actions/download-file-from-record-'
import { findRecord } from './lib/actions/find-record'
import { listFilesFromRecord } from './lib/actions/list-files-from-record'
import { updateRecord } from './lib/actions/update-record'
import { uploadFile } from './lib/actions/upload-file'
import { NinoxAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'
import { newRecord } from './lib/triggers/new-record'

export const ninox = createPiece({
    displayName: 'Ninox',
    auth: NinoxAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/ninox.png',
    authors: ['Sanket6652'],
    actions: [
        createRecord,
        updateRecord,
        deleteRecord,
        uploadFile,
        downloadFileFromRecord,
        findRecord,
        listFilesFromRecord,
        createCustomApiCallAction({
            auth: NinoxAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth}`,
                }
            },
        }),
    ],
    triggers: [newRecord],
})
