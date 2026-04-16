import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PiecePropValueSchema } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'

// Actions
import { createRecord } from './lib/actions/create-record'
import { deleteRecord } from './lib/actions/delete-record'
import { findRecords } from './lib/actions/find-records'
import { getRecord } from './lib/actions/get-record'
import { updateRecord } from './lib/actions/update-record'
import { uploadFile } from './lib/actions/upload-file'
import { smartsuiteAuth } from './lib/auth'
import { SMARTSUITE_API_URL } from './lib/common/constants'
// Triggers
import { newRecord } from './lib/triggers/new-record'
import { updatedRecord } from './lib/triggers/updated-record'

export const smartsuite = createPiece({
    displayName: 'SmartSuite',
    description: 'Collaborative work management platform combining databases with spreadsheets.',
    logoUrl: 'https://cdn.activepieces.com/pieces/smartsuite.png',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: smartsuiteAuth,
    minimumSupportedRelease: '0.30.0',
    authors: ['Kunal-Darekar', 'kishanprmr'],
    actions: [
        createRecord,
        updateRecord,
        deleteRecord,
        uploadFile,
        findRecords,
        getRecord,
        createCustomApiCallAction({
            auth: smartsuiteAuth,
            baseUrl: () => SMARTSUITE_API_URL,
            authMapping: async (auth) => {
                const authValue = auth
                return {
                    Authorization: `Token ${auth.props.apiKey}`,
                    'ACCOUNT-ID': auth.props.accountId,
                }
            },
        }),
    ],
    triggers: [newRecord, updatedRecord],
})
