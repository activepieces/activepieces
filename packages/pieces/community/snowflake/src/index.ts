import { createPiece } from '@activepieces/pieces-framework';
import { runMultipleQueries } from './lib/actions/run-multiple-queries';
import { runQuery } from './lib/actions/run-query';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { callProcedureAction } from './lib/actions/ai/call-procedure';
import { cancelQueryAction } from './lib/actions/ai/cancel-query';
import { copyStageIntoTableAction } from './lib/actions/ai/copy-stage-into-table';
import { countRowsAction } from './lib/actions/ai/count-rows';
import { deleteRowByKeyAction } from './lib/actions/ai/delete-row-by-key';
import { deleteRowsByFilterAction } from './lib/actions/ai/delete-rows-by-filter';
import { describeTableAction } from './lib/actions/ai/describe-table';
import { explainQueryAction } from './lib/actions/ai/explain-query';
import { findRowsAction } from './lib/actions/ai/find-rows';
import { getCurrentSessionAction } from './lib/actions/ai/get-current-session';
import { getQueryStatusAction } from './lib/actions/ai/get-query-status';
import { getRowByKeyAction } from './lib/actions/ai/get-row-by-key';
import { getViewDefinitionAction } from './lib/actions/ai/get-view-definition';
import { insertRowJsonAction } from './lib/actions/ai/insert-row-json';
import { insertRowsJsonAction } from './lib/actions/ai/insert-rows-json';
import { listColumnsAction } from './lib/actions/ai/list-columns';
import { listDatabasesAction } from './lib/actions/ai/list-databases';
import { listProceduresAction } from './lib/actions/ai/list-procedures';
import { listQueryHistoryAction } from './lib/actions/ai/list-query-history';
import { listRolesAction } from './lib/actions/ai/list-roles';
import { listSchemasAction } from './lib/actions/ai/list-schemas';
import { listStageFilesAction } from './lib/actions/ai/list-stage-files';
import { listStagesAction } from './lib/actions/ai/list-stages';
import { listTablesAiAction } from './lib/actions/ai/list-tables-ai';
import { listViewsAction } from './lib/actions/ai/list-views';
import { listWarehousesAction } from './lib/actions/ai/list-warehouses';
import { runSelectQueryAction } from './lib/actions/ai/run-select-query';
import { updateRowByKeyAction } from './lib/actions/ai/update-row-by-key';
import { updateRowsByFilterAction } from './lib/actions/ai/update-rows-by-filter';
import { upsertRowByKeyAction } from './lib/actions/ai/upsert-row-by-key';
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
  minimumSupportedRelease: '0.88.2',
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
    callProcedureAction,
    cancelQueryAction,
    copyStageIntoTableAction,
    countRowsAction,
    deleteRowByKeyAction,
    deleteRowsByFilterAction,
    describeTableAction,
    explainQueryAction,
    findRowsAction,
    getCurrentSessionAction,
    getQueryStatusAction,
    getRowByKeyAction,
    getViewDefinitionAction,
    insertRowJsonAction,
    insertRowsJsonAction,
    listColumnsAction,
    listDatabasesAction,
    listProceduresAction,
    listQueryHistoryAction,
    listRolesAction,
    listSchemasAction,
    listStageFilesAction,
    listStagesAction,
    listTablesAiAction,
    listViewsAction,
    listWarehousesAction,
    runSelectQueryAction,
    updateRowByKeyAction,
    updateRowsByFilterAction,
    upsertRowByKeyAction,
  ],
  triggers: [
    newRowTrigger,
    newOrUpdatedRowTrigger,
    newColumnTrigger,
    newTableTrigger,
    newViewTrigger,
  ],
});
