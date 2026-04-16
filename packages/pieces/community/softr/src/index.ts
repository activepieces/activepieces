import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createAppUser } from './lib/actions/create-app-user'
import { createDatabaseRecord } from './lib/actions/create-database-record'
import { deleteAppUser } from './lib/actions/delete-app-user'
import { deleteDatabaseRecord } from './lib/actions/delete-database-record'
import { findDatabaseRecord } from './lib/actions/find-database-record'
import { updateDatabaseRecord } from './lib/actions/update-database-record'
import { SoftrAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'
import { newDatabaseRecord } from './lib/triggers/new-database-record'

export const softr = createPiece({
    displayName: 'Softr',
    auth: SoftrAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/softr.png',
    categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
    authors: ['Sanket6652'],
    actions: [
        createAppUser,
        createDatabaseRecord,
        deleteAppUser,
        deleteDatabaseRecord,
        findDatabaseRecord,
        updateDatabaseRecord,
        createCustomApiCallAction({
            auth: SoftrAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    'Softr-Api-Key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [newDatabaseRecord],
})
