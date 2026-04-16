import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { clearTable } from './lib/actions/clear-table'
import { createRecords } from './lib/actions/create-records'
import { deleteRecord } from './lib/actions/delete-record'
import { findRecords } from './lib/actions/find-records'
import { getRecord } from './lib/actions/get-record'
import { updateRecord } from './lib/actions/update-record'
import { deletedRecordTrigger } from './lib/triggers/deleted-record'
import { newRecordTrigger } from './lib/triggers/new-record'
import { updatedRecordTrigger } from './lib/triggers/updated-record'

export const tables = createPiece({
    displayName: 'Tables',
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/tables.svg',
    categories: [PieceCategory.CORE],
    minimumSupportedRelease: '0.80.0',
    authors: ['amrdb'],
    auth: PieceAuth.None(),
    actions: [createRecords, deleteRecord, updateRecord, getRecord, findRecords, clearTable],
    triggers: [newRecordTrigger, updatedRecordTrigger, deletedRecordTrigger],
})
