import { createPiece } from '@activepieces/pieces-framework'
import { createRecord } from './lib/actions/create-record'
import { deleteRecord } from './lib/actions/delete-record'
import { findRecords } from './lib/actions/find-records'
import { getRecord } from './lib/actions/get-record'
import { updateRecord } from './lib/actions/update-record'
import { insightlyAuth } from './lib/common/common'
import { deletedRecord } from './lib/triggers/deleted-record'
import { newRecord } from './lib/triggers/new-record'
import { updatedRecord } from './lib/triggers/updated-record'

export const insightly = createPiece({
    displayName: 'Insightly',
    auth: insightlyAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/insightly.png',
    authors: ['fortunamide', 'onyedikachi-david'],
    actions: [createRecord, updateRecord, getRecord, deleteRecord, findRecords],
    triggers: [newRecord, updatedRecord, deletedRecord],
})
