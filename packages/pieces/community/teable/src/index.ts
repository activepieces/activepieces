import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createRecordAction } from './lib/actions/create-record'
import { deleteRecordAction } from './lib/actions/delete-record'
import { findRecordAction } from './lib/actions/find-record'
import { findRecordsAction } from './lib/actions/find-records'
import { updateRecordAction } from './lib/actions/update-record'
import { uploadAttachmentAction } from './lib/actions/upload-attachment'
import { getTeableBaseUrl, getTeableToken, TeableAuth, TeableAuthValue } from './lib/auth'

export const teable = createPiece({
    displayName: 'Teable',
    auth: TeableAuth,
    description: 'No-code database built on PostgreSQL',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/teable.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['codegino', 'onyedikachi-david'],
    actions: [
        createRecordAction,
        findRecordsAction,
        findRecordAction,
        updateRecordAction,
        deleteRecordAction,
        uploadAttachmentAction,
        createCustomApiCallAction({
            auth: TeableAuth,
            baseUrl: (auth) => `${getTeableBaseUrl(auth as TeableAuthValue)}/api`,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${getTeableToken(auth as TeableAuthValue)}`,
            }),
        }),
    ],
    triggers: [],
})
