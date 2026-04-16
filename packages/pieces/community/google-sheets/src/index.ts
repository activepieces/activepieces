import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { clearSheetAction } from './lib/actions/clear-sheet'
import { copyWorksheetAction } from './lib/actions/copy-worksheet'
import { createColumnAction } from './lib/actions/create-column'
import { createSpreadsheetAction } from './lib/actions/create-spreadsheet'
import { createWorksheetAction } from './lib/actions/create-worksheet'
import { deleteRowAction } from './lib/actions/delete-row.action'
import { deleteWorksheetAction } from './lib/actions/delete-worksheet'
import { exportSheetAction } from './lib/actions/export-sheet'
import { findRowByNumAction } from './lib/actions/find-row-by-num'
import { findRowsAction } from './lib/actions/find-rows'
import { findSpreadsheets } from './lib/actions/find-spreadsheets'
import { findWorksheetAction } from './lib/actions/find-worksheet'
import { formatRowAction } from './lib/actions/format-spreadsheet-row'
import { getManyRowsAction } from './lib/actions/get-many-rows'
import { getRowsAction } from './lib/actions/get-rows'
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows.action'
import { insertRowAction } from './lib/actions/insert-row.action'
import { renameWorksheetAction } from './lib/actions/rename-worksheet'
import { updateMultipleRowsAction } from './lib/actions/update-multiple-rows'
import { updateRowAction } from './lib/actions/update-row'
import { GoogleSheetsAuthValue, getAccessToken, googleSheetsAuth, googleSheetsCommon } from './lib/common/common'
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row.trigger'
import { newRowAddedTrigger } from './lib/triggers/new-row-added-webhook'
import { newSpreadsheetTrigger } from './lib/triggers/new-spreadsheet'
import { newWorksheetTrigger } from './lib/triggers/new-worksheet'

export const googleSheets = createPiece({
    minimumSupportedRelease: '0.71.4',
    logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: [
        'ShayPunter',
        'Ozak93',
        'Abdallah-Alwarawreh',
        'Salem-Alaa',
        'kishanprmr',
        'MoShizzle',
        'AbdulTheActivePiecer',
        'khaledmashaly',
        'abuaboud',
        'geekyme',
    ],
    actions: [
        insertRowAction,
        insertMultipleRowsAction,
        updateRowAction,
        updateMultipleRowsAction,
        deleteRowAction,
        findRowsAction,
        createSpreadsheetAction,
        createWorksheetAction,
        clearSheetAction,
        deleteWorksheetAction,
        renameWorksheetAction,
        formatRowAction,
        findRowByNumAction,
        getRowsAction,
        getManyRowsAction,
        findSpreadsheets,
        findWorksheetAction,
        copyWorksheetAction,
        createColumnAction,
        exportSheetAction,
        createCustomApiCallAction({
            auth: googleSheetsAuth,
            baseUrl: () => {
                return googleSheetsCommon.baseUrl
            },
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${await getAccessToken(auth as GoogleSheetsAuthValue)}`,
                }
            },
        }),
    ],
    displayName: 'Google Sheets',
    description: 'Create, edit, and collaborate on spreadsheets online',
    triggers: [newOrUpdatedRowTrigger, newRowAddedTrigger, newSpreadsheetTrigger, newWorksheetTrigger],
    auth: googleSheetsAuth,
})
