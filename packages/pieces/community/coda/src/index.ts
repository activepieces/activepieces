import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createRowAction } from './lib/actions/create-row'
import { findRowAction } from './lib/actions/find-row'
import { getRowAction } from './lib/actions/get-row'
import { getTableAction } from './lib/actions/get-table'
import { listTablesAction } from './lib/actions/list-tables'
import { updateRowAction } from './lib/actions/update-row'
import { upsertRowAction } from './lib/actions/upsert-row'
import { codaAuth } from './lib/auth'
import { CODA_BASE_URL } from './lib/common/types'
import { newRowCreatedTrigger } from './lib/triggers/new-row-created'

export const coda = createPiece({
    displayName: 'Coda',
    logoUrl: 'https://cdn.activepieces.com/pieces/coda.png',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: codaAuth,
    authors: ['onyedikachi-david', 'kishanprmr', 'rimjhimyadav'],
    actions: [
        createRowAction,
        updateRowAction,
        upsertRowAction,
        findRowAction,
        getRowAction,
        listTablesAction,
        getTableAction,
        createCustomApiCallAction({
            auth: codaAuth,
            baseUrl: () => CODA_BASE_URL,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [newRowCreatedTrigger],
})
