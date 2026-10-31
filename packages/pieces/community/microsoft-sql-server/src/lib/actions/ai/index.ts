import { describeTable } from './schema/describe-table';
import { getViewDefinition } from './schema/get-view-definition';
import { listDatabases } from './schema/list-databases';
import { listIndexes } from './schema/list-indexes';
import { listRoutines } from './schema/list-routines';
import { listSchemas } from './schema/list-schemas';
import { listViews } from './schema/list-views';
import { countRows } from './rows/count-rows';
import { deleteRowsAi } from './rows/delete-rows';
import { findRowsAi } from './rows/find-rows';
import { getRowByKey } from './rows/get-row-by-key';
import { insertRowsAi } from './rows/insert-rows';
import { updateRowsAi } from './rows/update-rows';
import { upsertRow } from './rows/upsert-row';
import { callProcedure } from './queries/call-procedure';
import { explainQuery } from './queries/explain-query';
import { runSelectQuery } from './queries/run-select-query';
import { getServerInfo } from './server/get-server-info';
import { listSessions } from './server/list-sessions';

export const microsoftSqlServerAiActions = [
  listDatabases,
  listSchemas,
  describeTable,
  listIndexes,
  listViews,
  getViewDefinition,
  listRoutines,
  findRowsAi,
  getRowByKey,
  countRows,
  insertRowsAi,
  upsertRow,
  updateRowsAi,
  deleteRowsAi,
  runSelectQuery,
  explainQuery,
  callProcedure,
  getServerInfo,
  listSessions,
];
