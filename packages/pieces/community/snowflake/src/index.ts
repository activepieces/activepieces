import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createDynamicTableAction } from './lib/actions/create-dynamic-table'
import { deleteRowAction } from './lib/actions/delete-row'
import { executeStoredProcedureAction } from './lib/actions/execute-stored-procedure'
import { getRowByIdAction } from './lib/actions/get-row-by-id'
import { getTableSchemaAction } from './lib/actions/get-table-schema'
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows'
import { insertRowAction } from './lib/actions/insert-row'
import { listTablesAction } from './lib/actions/list-tables'
import { loadDataFromStageAction } from './lib/actions/load-data-from-stage'
import { runMultipleQueries } from './lib/actions/run-multiple-queries'
import { runQuery } from './lib/actions/run-query'
import { searchRowsAction } from './lib/actions/search-rows'
import { updateRowAction } from './lib/actions/update-row'
import { upsertRowAction } from './lib/actions/upsert-row'
import { snowflakeAuth } from './lib/auth'
import { newColumnTrigger } from './lib/triggers/new-column'
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row'
import { newRowTrigger } from './lib/triggers/new-row'
import { newTableTrigger } from './lib/triggers/new-table'
import { newViewTrigger } from './lib/triggers/new-view'

export const snowflake = createPiece({
    displayName: 'Snowflake',
    description: 'Data warehouse built for the cloud',

    auth: snowflakeAuth,
    minimumSupportedRelease: '0.27.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/snowflake.png',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    authors: ['AdamSelene', 'abuaboud', 'valentin-mourtialon', 'onyedikachi-david'],
    actions: [
        runQuery,
        runMultipleQueries,
        insertRowAction,
        updateRowAction,
        deleteRowAction,
        upsertRowAction,
        insertMultipleRowsAction,
        getRowByIdAction,
        searchRowsAction,
        getTableSchemaAction,
        listTablesAction,
        executeStoredProcedureAction,
        createDynamicTableAction,
        loadDataFromStageAction,
    ],
    triggers: [newRowTrigger, newOrUpdatedRowTrigger, newColumnTrigger, newTableTrigger, newViewTrigger],
})
