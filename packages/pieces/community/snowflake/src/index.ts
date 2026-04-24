import { createPiece } from '@activepieces/pieces-framework';
import { runMultipleQueries } from './lib/actions/run-multiple-queries';
import { runQuery } from './lib/actions/run-query';
import { PieceCategory } from '@activepieces/shared';
import { insertRowAction } from './lib/actions/insert-row';
import { updateRowAction } from './lib/actions/update-row';
import { deleteRowAction } from './lib/actions/delete-row';
import { upsertRowAction } from './lib/actions/upsert-row';
import { insertMultipleRowsAction } from './lib/actions/insert-multiple-rows';
import { getRowByIdAction } from './lib/actions/get-row-by-id';
import { searchRowsAction } from './lib/actions/search-rows';
import { getTableSchemaAction } from './lib/actions/get-table-schema';
import { listTablesAction } from './lib/actions/list-tables';
import { executeStoredProcedureAction } from './lib/actions/execute-stored-procedure';
import { createDynamicTableAction } from './lib/actions/create-dynamic-table';
import { loadDataFromStageAction } from './lib/actions/load-data-from-stage';
import { snowflakeAuth } from './lib/auth';
import { newColumnTrigger } from './lib/triggers/new-column';
import { newTableTrigger } from './lib/triggers/new-table';
import { newViewTrigger } from './lib/triggers/new-view';
import { newRowTrigger } from './lib/triggers/new-row';
import { newOrUpdatedRowTrigger } from './lib/triggers/new-or-updated-row';

export const snowflake = createPiece({
  displayName: 'Snowflake',
  description: 'Data warehouse built for the cloud',

  auth: snowflakeAuth,
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/snowflake.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: [
    'AdamSelene',
    'abuaboud',
    'valentin-mourtialon',
    'onyedikachi-david',
  ],
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
  triggers: [
    newRowTrigger,
    newOrUpdatedRowTrigger,
    newColumnTrigger,
    newTableTrigger,
    newViewTrigger,
  ],
});
