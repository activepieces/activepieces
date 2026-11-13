import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lastCall, resetSnowflake, respond, runAction, state, userCalls } from './helpers';

vi.mock('snowflake-sdk', async () => (await import('./helpers')).fakeSdk);

import { runSelectQueryAction } from '../src/lib/actions/ai/run-select-query';
import { explainQueryAction } from '../src/lib/actions/ai/explain-query';
import { getQueryStatusAction } from '../src/lib/actions/ai/get-query-status';
import { cancelQueryAction } from '../src/lib/actions/ai/cancel-query';
import { listQueryHistoryAction } from '../src/lib/actions/ai/list-query-history';
import { findRowsAction } from '../src/lib/actions/ai/find-rows';
import { countRowsAction } from '../src/lib/actions/ai/count-rows';
import { getRowByKeyAction } from '../src/lib/actions/ai/get-row-by-key';
import { insertRowJsonAction } from '../src/lib/actions/ai/insert-row-json';
import { insertRowsJsonAction } from '../src/lib/actions/ai/insert-rows-json';
import { upsertRowByKeyAction } from '../src/lib/actions/ai/upsert-row-by-key';
import { updateRowByKeyAction } from '../src/lib/actions/ai/update-row-by-key';
import { updateRowsByFilterAction } from '../src/lib/actions/ai/update-rows-by-filter';
import { deleteRowByKeyAction } from '../src/lib/actions/ai/delete-row-by-key';
import { deleteRowsByFilterAction } from '../src/lib/actions/ai/delete-rows-by-filter';
import { listDatabasesAction } from '../src/lib/actions/ai/list-databases';
import { listSchemasAction } from '../src/lib/actions/ai/list-schemas';
import { listTablesAiAction } from '../src/lib/actions/ai/list-tables-ai';
import { listViewsAction } from '../src/lib/actions/ai/list-views';
import { getViewDefinitionAction } from '../src/lib/actions/ai/get-view-definition';
import { describeTableAction } from '../src/lib/actions/ai/describe-table';
import { listColumnsAction } from '../src/lib/actions/ai/list-columns';
import { listWarehousesAction } from '../src/lib/actions/ai/list-warehouses';
import { listStagesAction } from '../src/lib/actions/ai/list-stages';
import { listStageFilesAction } from '../src/lib/actions/ai/list-stage-files';
import { copyStageIntoTableAction } from '../src/lib/actions/ai/copy-stage-into-table';
import { listProceduresAction } from '../src/lib/actions/ai/list-procedures';
import { callProcedureAction } from '../src/lib/actions/ai/call-procedure';
import { getCurrentSessionAction } from '../src/lib/actions/ai/get-current-session';
import { listRolesAction } from '../src/lib/actions/ai/list-roles';

const QID = '01b2c3d4-0000-1234-0000-0001a2b3c4d5';

beforeEach(() => resetSnowflake());

describe('query actions', () => {
  it('run_select_query runs one read-only statement with a row cap', async () => {
    respond({ match: /SELECT/, rows: [{ A: 1 }, { A: 2 }, { A: 3 }] });
    const out = await runAction({ action: runSelectQueryAction, propsValue: { sql: 'SELECT A FROM T WHERE B = ?;', parameters: ['x'], limit: 2 } });
    expect(lastCall()).toEqual({ sql: 'SELECT A FROM T WHERE B = ?', binds: ['x'] });
    expect(out).toMatchObject({ rows: [{ A: 1 }, { A: 2 }], rowCount: 2, totalRows: 3, truncated: true, queryId: QID, columns: ['A'] });
    await expect(runAction({ action: runSelectQueryAction, propsValue: { sql: 'DROP TABLE T' } })).rejects.toThrow('read-only');
    await expect(runAction({ action: runSelectQueryAction, propsValue: { sql: 'SELECT 1', limit: 5000 } })).rejects.toThrow('Limit');
  });

  it('explain_query parses the JSON plan', async () => {
    respond({ match: /EXPLAIN/, rows: [{ content: '{"GlobalStats":{"partitionsTotal":3}}' }] });
    const out = await runAction({ action: explainQueryAction, propsValue: { sql: 'SELECT * FROM T' } });
    expect(lastCall().sql).toBe('EXPLAIN USING JSON SELECT * FROM T');
    expect(out).toEqual({ plan: { GlobalStats: { partitionsTotal: 3 } } });
    await expect(runAction({ action: explainQueryAction, propsValue: { sql: 'SHOW TABLES' } })).rejects.toThrow('SELECT or WITH');
  });

  it('explain_query accepts queries with leading comments', async () => {
    respond({ match: /EXPLAIN/, rows: [{ content: '{}' }] });
    await runAction({ action: explainQueryAction, propsValue: { sql: '-- daily report\n/* v2 */ SELECT 1' } });
    expect(lastCall().sql).toBe('EXPLAIN USING JSON -- daily report\n/* v2 */ SELECT 1');
  });

  it('get_query_status returns status and optional rows', async () => {
    respond({ match: /RESULT_SCAN/, rows: [{ A: 1 }] });
    const out = await runAction({ action: getQueryStatusAction, propsValue: { queryId: QID, includeResults: true } });
    expect(out).toMatchObject({ queryId: QID, status: 'SUCCESS', isRunning: false, isError: false, rows: [{ A: 1 }], rowCount: 1 });
    expect(lastCall()).toEqual({ sql: 'SELECT * FROM TABLE(RESULT_SCAN(?))', binds: [QID] });
    state.queryStatus = 'RUNNING';
    resetSnowflake();
    state.queryStatus = 'RUNNING';
    expect(await runAction({ action: getQueryStatusAction, propsValue: { queryId: QID, includeResults: true } })).toMatchObject({ isRunning: true, rows: [] });
    await expect(runAction({ action: getQueryStatusAction, propsValue: { queryId: "x'; --" } })).rejects.toThrow('UUID');
  });

  it('cancel_query binds the query id', async () => {
    respond({ match: /CANCEL/, rows: [{ message: 'query [x] terminated.' }] });
    expect(await runAction({ action: cancelQueryAction, propsValue: { queryId: QID } })).toEqual({ queryId: QID, message: 'query [x] terminated.' });
    expect(lastCall()).toEqual({ sql: 'SELECT SYSTEM$CANCEL_QUERY(?) AS "message"', binds: [QID] });
  });

  it('list_query_history filters by status', async () => {
    respond({ match: /QUERY_HISTORY/, rows: [{ QUERY_ID: QID, EXECUTION_STATUS: 'FAILED_WITH_ERROR' }] });
    const out = await runAction({ action: listQueryHistoryAction, propsValue: { database: 'DB', status: 'FAILED_WITH_ERROR', limit: 10 } });
    expect(lastCall().sql).toContain('FROM TABLE(DB.INFORMATION_SCHEMA.QUERY_HISTORY(RESULT_LIMIT => ?)) WHERE EXECUTION_STATUS = ? ORDER BY START_TIME DESC LIMIT 10');
    expect(lastCall().binds).toEqual([10000, 'FAILED_WITH_ERROR']);
    expect(out).toMatchObject({ items: [{ query_id: QID, execution_status: 'FAILED_WITH_ERROR' }], count: 1 });
    await expect(runAction({ action: listQueryHistoryAction, propsValue: { status: 'X' } })).rejects.toThrow('Status');
  });
});

describe('row actions', () => {
  it('find_rows uses bound filters, sort and paging', async () => {
    respond({ match: /SELECT/, rows: [{ ID: 1 }, { ID: 2 }, { ID: 3 }] });
    const out = await runAction({ action: findRowsAction, propsValue: {
      table: 'DB.PUBLIC.ORDERS',
      filters: [{ column: 'STATUS', operator: '=', value: 'open' }],
      columns: ['ID'],
      sort: [{ column: 'ID', direction: 'DESC' }],
      limit: 2,
      offset: 4,
    } });
    expect(lastCall()).toEqual({ sql: 'SELECT ID FROM DB.PUBLIC.ORDERS WHERE STATUS = ? ORDER BY ID DESC LIMIT 3 OFFSET 4', binds: ['open'] });
    expect(out).toEqual({ rows: [{ ID: 1 }, { ID: 2 }], rowCount: 2, hasMore: true, nextOffset: 6 });
  });

  it('count_rows counts with filters', async () => {
    respond({ match: /COUNT/, rows: [{ count: 42 }] });
    expect(await runAction({ action: countRowsAction, propsValue: { table: 'T', filters: [{ column: 'A', operator: '>', value: '1' }] } })).toEqual({ count: 42 });
    expect(lastCall()).toEqual({ sql: 'SELECT COUNT(*) AS "count" FROM T WHERE A > ?', binds: ['1'] });
  });

  it('get_row_by_key returns found/row and refuses non-unique keys', async () => {
    respond({ match: /SELECT/, rows: [{ ID: 1 }] });
    expect(await runAction({ action: getRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '1' } })).toEqual({ found: true, row: { ID: 1 } });
    resetSnowflake();
    expect(await runAction({ action: getRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '1' } })).toEqual({ found: false, row: null });
    respond({ match: /SELECT/, rows: [{ ID: 1 }, { ID: 1 }] });
    await expect(runAction({ action: getRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '1' } })).rejects.toThrow('not a unique key');
  });

  it('insert_row_json inserts one row with JSON values', async () => {
    respond({ match: /INSERT/, rows: [{ 'number of rows inserted': 1 }] });
    const out = await runAction({ action: insertRowJsonAction, propsValue: { table: 'T', row: { ID: 1, TAGS: ['a'] } } });
    expect(lastCall()).toEqual({ sql: 'INSERT INTO T (ID, TAGS) SELECT ?, PARSE_JSON(?)', binds: [1, '["a"]'] });
    expect(out).toEqual({ rowsInserted: 1, queryId: QID });
    await expect(runAction({ action: insertRowJsonAction, propsValue: { table: 'T', row: '[1]' } })).rejects.toThrow('JSON object');
  });

  it('insert_rows_json enforces the batch size', async () => {
    respond({ match: /INSERT/, rows: [{ 'number of rows inserted': 2 }] });
    expect(await runAction({ action: insertRowsJsonAction, propsValue: { table: 'T', rows: [{ A: 1 }, { A: 2 }] } })).toMatchObject({ rowsInserted: 2 });
    expect(lastCall()).toEqual({ sql: 'INSERT INTO T (A) VALUES (?), (?)', binds: [1, 2] });
    await expect(runAction({ action: insertRowsJsonAction, propsValue: { table: 'T', rows: [] } })).rejects.toThrow('between 1 and 500');
  });

  it('upsert_row_by_key merges on key columns', async () => {
    respond({ match: /MERGE/, rows: [{ 'number of rows inserted': 1, 'number of rows updated': 0 }] });
    const out = await runAction({ action: upsertRowByKeyAction, propsValue: { table: 'T', keyColumns: ['ID'], row: { ID: 1, NAME: 'x' } } });
    expect(lastCall().sql).toContain('ON target.ID = source.C0');
    expect(out).toEqual({ rowsInserted: 1, rowsUpdated: 0, queryId: QID });
  });

  it('upsert_row_by_key rejects null key values so retries cannot duplicate', async () => {
    await expect(runAction({ action: upsertRowByKeyAction, propsValue: { table: 'T', keyColumns: ['ID'], row: { ID: null, NAME: 'Alice' } } })).rejects.toThrow('must have a value');
    expect(userCalls().some((call) => call.sql.includes('MERGE'))).toBe(false);
  });

  it('update_row_by_key runs in a transaction and rolls back on duplicates', async () => {
    respond({ match: /UPDATE/, rows: [{ 'number of rows updated': 1 }] });
    expect(await runAction({ action: updateRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '1', values: { S: 'x' } } })).toEqual({ found: true, rowsAffected: 1 });
    expect(userCalls().map((c) => c.sql)).toEqual(['BEGIN', 'UPDATE T SET S = ? WHERE ID = ?', 'COMMIT']);
    expect(userCalls()[1].binds).toEqual(['x', '1']);
    resetSnowflake();
    respond({ match: /UPDATE/, rows: [{ 'number of rows updated': 2 }] });
    await expect(runAction({ action: updateRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '1', values: { S: 'x' } } })).rejects.toThrow('not a unique key');
    expect(userCalls().map((c) => c.sql)).toEqual(['BEGIN', 'UPDATE T SET S = ? WHERE ID = ?', 'ROLLBACK']);
  });

  it('update_rows_by_filter requires a filter and respects Max Rows', async () => {
    await expect(runAction({ action: updateRowsByFilterAction, propsValue: { table: 'T', filters: [], values: { S: 1 } } })).rejects.toThrow('at least one filter');
    respond({ match: /UPDATE/, rows: [{ 'number of rows updated': 5 }] });
    await expect(
      runAction({ action: updateRowsByFilterAction, propsValue: { table: 'T', filters: [{ column: 'A', operator: '=', value: '1' }], values: { S: 1 }, maxRows: 4 } })
    ).rejects.toThrow('more than Max Rows (4)');
    expect(userCalls().at(-1)?.sql).toBe('ROLLBACK');
    resetSnowflake();
    respond({ match: /UPDATE/, rows: [{ 'number of rows updated': 5 }] });
    expect(await runAction({ action: updateRowsByFilterAction, propsValue: { table: 'T', filters: [{ column: 'A', operator: '=', value: '1' }], values: { S: 1 } } })).toEqual({ rowsAffected: 5 });
    expect(userCalls()[1]).toEqual({ sql: 'UPDATE T SET S = ? WHERE A = ?', binds: [1, '1'] });
  });

  it('delete_row_by_key reports alreadyDeleted', async () => {
    respond({ match: /DELETE/, rows: [{ 'number of rows deleted': 0 }] });
    expect(await runAction({ action: deleteRowByKeyAction, propsValue: { table: 'T', keyColumn: 'ID', keyValue: '9' } })).toEqual({ deleted: false, alreadyDeleted: true });
    expect(userCalls()[1]).toEqual({ sql: 'DELETE FROM T WHERE ID = ?', binds: ['9'] });
  });

  it('delete_rows_by_filter guards row count', async () => {
    await expect(runAction({ action: deleteRowsByFilterAction, propsValue: { table: 'T' } })).rejects.toThrow('at least one filter');
    respond({ match: /DELETE/, rows: [{ 'number of rows deleted': 3 }] });
    expect(await runAction({ action: deleteRowsByFilterAction, propsValue: { table: 'T', filters: [{ column: 'A', operator: 'IS NULL' }] } })).toEqual({ rowsDeleted: 3 });
    expect(userCalls().map((c) => c.sql)).toEqual(['BEGIN', 'DELETE FROM T WHERE A IS NULL', 'COMMIT']);
  });
});

describe('catalog actions', () => {
  it('list_databases applies LIKE and the limit', async () => {
    respond({ match: /SHOW DATABASES/, rows: [{ name: 'A' }, { name: 'B' }] });
    const out = await runAction({ action: listDatabasesAction, propsValue: { namePattern: "%it's%", limit: 1 } });
    expect(lastCall().sql).toBe("SHOW DATABASES LIKE '%it''s%'");
    expect(out).toMatchObject({ items: [{ name: 'A' }], count: 1, truncated: true });
  });

  it('list_schemas scopes to a database', async () => {
    await runAction({ action: listSchemasAction, propsValue: { database: 'DB' } });
    expect(lastCall().sql).toBe('SHOW SCHEMAS IN DATABASE DB');
  });

  it('list_tables_ai scopes to a schema', async () => {
    respond({ match: /SHOW TABLES/, rows: [{ name: 'ORDERS' }] });
    const out = await runAction({ action: listTablesAiAction, propsValue: { database: 'DB', schema: 'PUBLIC' } });
    expect(lastCall().sql).toBe('SHOW TABLES IN SCHEMA DB.PUBLIC');
    expect(out).toMatchObject({ items: [{ table_name: 'ORDERS' }] });
  });

  it('list_views accepts a qualified schema', async () => {
    respond({ match: /SHOW VIEWS/, rows: [{ name: 'V' }] });
    expect(await runAction({ action: listViewsAction, propsValue: { schema: 'DB.PUBLIC' } })).toMatchObject({ items: [{ view_name: 'V' }] });
    expect(lastCall().sql).toBe('SHOW VIEWS IN SCHEMA DB.PUBLIC');
  });

  it('get_view_definition binds the view name', async () => {
    respond({ match: /GET_DDL/, rows: [{ ddl: 'create view V as select 1;' }] });
    expect(await runAction({ action: getViewDefinitionAction, propsValue: { view: 'db.public.v' } })).toEqual({ view: 'db.public.v', ddl: 'create view V as select 1;' });
    expect(lastCall().binds).toEqual(['db.public.v']);
  });

  it('describe_table_ai maps flags to booleans', async () => {
    respond({ match: /DESCRIBE/, rows: [{ name: 'ID', type: 'NUMBER', 'null?': 'N', 'primary key': 'Y', 'unique key': 'N' }] });
    const out = await runAction({ action: describeTableAction, propsValue: { table: 'T' } });
    expect(out).toEqual({ table: 'T', columns: [{ name: 'ID', type: 'NUMBER', nullable: false, default: null, primaryKey: true, uniqueKey: false, comment: null }] });
  });

  it('list_columns filters with binds', async () => {
    respond({ match: /INFORMATION_SCHEMA.COLUMNS/, rows: [{ TABLE_NAME: 'T', COLUMN_NAME: 'EMAIL' }] });
    const out = await runAction({ action: listColumnsAction, propsValue: { database: 'DB', schema: 'public', table: '"t"', columnPattern: '%mail%' } });
    expect(lastCall().sql).toContain('FROM DB.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA <> \'INFORMATION_SCHEMA\' AND TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME ILIKE ?');
    expect(lastCall().binds).toEqual(['PUBLIC', 't', '%mail%']);
    expect(out).toMatchObject({ items: [{ table_name: 'T', column_name: 'EMAIL' }], truncated: false });
  });

  it('list_warehouses, list_stages, list_procedures and list_roles run SHOW', async () => {
    await runAction({ action: listWarehousesAction, propsValue: {} });
    expect(lastCall().sql).toBe('SHOW WAREHOUSES');
    await runAction({ action: listStagesAction, propsValue: { database: 'DB' } });
    expect(lastCall().sql).toBe('SHOW STAGES IN DATABASE DB');
    respond({ match: /SHOW PROCEDURES/, rows: [{ name: 'P', catalog_name: 'DB', arguments: 'P(NUMBER) RETURN VARCHAR' }] });
    expect(await runAction({ action: listProceduresAction, propsValue: { schema: 'PUBLIC', namePattern: 'P%' } })).toMatchObject({ items: [{ name: 'P', database_name: 'DB' }] });
    expect(lastCall().sql).toBe("SHOW PROCEDURES LIKE 'P%' IN SCHEMA PUBLIC");
    await runAction({ action: listRolesAction, propsValue: {} });
    expect(lastCall().sql).toBe('SHOW ROLES');
  });

  it('list_procedures skips built-in system procedures before applying the limit', async () => {
    respond({ match: /SHOW PROCEDURES/, rows: [
      { name: 'SYS1', is_builtin: 'Y', schema_name: '' },
      { name: 'SYS2', is_builtin: 'Y', schema_name: '' },
      { name: 'MINE', is_builtin: 'N', schema_name: 'S', catalog_name: 'DB' },
      { name: 'MINE2', is_builtin: 'N', schema_name: 'S', catalog_name: 'DB' },
    ] });
    const out = await runAction({ action: listProceduresAction, propsValue: { database: 'DB', schema: 'S', limit: 1 } });
    expect(out).toMatchObject({ items: [{ name: 'MINE' }], count: 1, truncated: true });
  });

  it('list_stage_files lists a path with a pattern', async () => {
    respond({ match: /^LIST/, rows: [{ name: 's3://b/a.csv', size: 10, md5: 'x', last_modified: 'Mon' }] });
    const out = await runAction({ action: listStageFilesAction, propsValue: { stage: '@DB.PUBLIC.S', path: 'in/', pattern: '.*csv' } });
    expect(lastCall().sql).toBe("LIST @DB.PUBLIC.S/in/ PATTERN = '.*csv'");
    expect(out).toMatchObject({ items: [{ name: 's3://b/a.csv', size: 10 }], count: 1 });
  });

  it('copy_stage_into_table returns per-file results', async () => {
    respond({ match: /COPY/, rows: [{ file: 'a.csv', status: 'LOADED', rows_loaded: 4 }] });
    const out = await runAction({ action: copyStageIntoTableAction, propsValue: { table: 'T', stage: 'S', path: 'in', fileFormat: 'JSON' } });
    expect(lastCall().sql).toBe("COPY INTO T FROM @S/in FILE_FORMAT = (TYPE = 'JSON') ON_ERROR = 'ABORT_STATEMENT'");
    expect(out).toMatchObject({ filesProcessed: 1, rowsLoaded: 4 });
  });

  it('call_procedure returns the first value', async () => {
    respond({ match: /CALL/, rows: [{ P: 'done' }] });
    const out = await runAction({ action: callProcedureAction, propsValue: { procedure: 'DB.PUBLIC.P', arguments: ['a', 2] } });
    expect(lastCall()).toEqual({ sql: 'CALL DB.PUBLIC.P(?, ?)', binds: ['a', 2] });
    expect(out).toMatchObject({ result: 'done', rowCount: 1 });
    await expect(runAction({ action: callProcedureAction, propsValue: { procedure: 'P()' } })).resolves.toBeDefined();
    expect(lastCall().sql).toBe('CALL "P()"()');
  });

  it('get_current_session returns the session context', async () => {
    respond({ match: /CURRENT_USER/, rows: [{ user: 'AP_TEST', role: 'R', warehouse: 'W', database: 'D', schema: 'S', account: 'A', region: 'AWS_US_EAST_1', version: '9.1' }] });
    expect(await runAction({ action: getCurrentSessionAction, propsValue: {} })).toMatchObject({ user: 'AP_TEST', region: 'AWS_US_EAST_1' });
  });
});
