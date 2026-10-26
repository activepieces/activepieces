import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lastCall, resetSnowflake, respond, runAction, state, userCalls } from './helpers';

vi.mock('snowflake-sdk', async () => (await import('./helpers')).fakeSdk);

import { runQuery } from '../src/lib/actions/run-query';
import { runMultipleQueries } from '../src/lib/actions/run-multiple-queries';
import { insertRowAction } from '../src/lib/actions/insert-row';
import { insertMultipleRowsAction } from '../src/lib/actions/insert-multiple-rows';
import { updateRowAction } from '../src/lib/actions/update-row';
import { deleteRowAction } from '../src/lib/actions/delete-row';
import { upsertRowAction } from '../src/lib/actions/upsert-row';
import { getRowByIdAction } from '../src/lib/actions/get-row-by-id';
import { searchRowsAction } from '../src/lib/actions/search-rows';
import { getTableSchemaAction } from '../src/lib/actions/get-table-schema';
import { listTablesAction } from '../src/lib/actions/list-tables';
import { executeStoredProcedureAction } from '../src/lib/actions/execute-stored-procedure';
import { createDynamicTableAction } from '../src/lib/actions/create-dynamic-table';
import { loadDataFromStageAction } from '../src/lib/actions/load-data-from-stage';

const table = { database: 'DB', schema: 'PUBLIC', table: 'DB.PUBLIC.ORDERS' };

beforeEach(() => resetSnowflake());

describe('human actions', () => {
  it('runQuery binds parameters and applies the timeout as statement timeout', async () => {
    respond({ match: /SELECT/, rows: [{ ID: 1 }] });
    const rows = await runAction({ action: runQuery, propsValue: { sqlText: 'SELECT * FROM T WHERE ID = ?', binds: [1], timeout: 45000 } });
    expect(rows).toEqual([{ ID: 1 }]);
    expect(state.calls[0].sql).toBe('ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = 45');
    expect(lastCall()).toEqual({ sql: 'SELECT * FROM T WHERE ID = ?', binds: [1] });
  });

  it('runMultipleQueries rolls back the transaction on failure', async () => {
    respond({ match: /BAD/, rows: new Error('boom') });
    await expect(
      runAction({ action: runMultipleQueries, propsValue: { sqlTexts: ['INSERT 1', 'BAD'], useTransaction: true } })
    ).rejects.toThrow('boom');
    expect(userCalls().map((c) => c.sql)).toEqual(['BEGIN', 'INSERT 1', 'BAD', 'ROLLBACK']);
  });

  it('runMultipleQueries returns per-query results and commits', async () => {
    respond({ match: /SELECT/, rows: [{ A: 1 }] });
    const out = await runAction({ action: runMultipleQueries, propsValue: { sqlTexts: ['SELECT 1'], useTransaction: true } });
    expect(out).toEqual([{ query: 'SELECT 1', result: [{ A: 1 }] }]);
    expect(userCalls().map((c) => c.sql)).toEqual(['BEGIN', 'SELECT 1', 'COMMIT']);
  });

  it('insert-row quotes odd column names and binds values', async () => {
    respond({ match: /INSERT/, rows: [{ 'number of rows inserted': 1 }] });
    const out = await runAction({ action: insertRowAction, propsValue: { ...table, table_column_values: { NAME: 'Jo', 'first name': 'J' } } });
    expect(lastCall()).toEqual({ sql: 'INSERT INTO DB.PUBLIC.ORDERS (NAME, "first name") VALUES (?, ?)', binds: ['Jo', 'J'] });
    expect(out).toEqual([{ 'number of rows inserted': 1 }]);
  });

  it('insert_multiple_rows stores objects as JSON', async () => {
    respond({ match: /INSERT/, rows: [{ 'number of rows inserted': 2 }] });
    const out = await runAction({ action: insertMultipleRowsAction, propsValue: { ...table, rows: [{ A: 1, J: { x: 1 } }, '{"A": 2, "J": null}'] } });
    expect(lastCall().sql).toBe('INSERT INTO DB.PUBLIC.ORDERS ("A", "J") SELECT ?, PARSE_JSON(?) UNION ALL SELECT ?, ?');
    expect(out).toEqual({ success: true, rows_inserted: 2 });
  });

  it('insert_multiple_rows keeps the exact case of column names', async () => {
    respond({ match: /INSERT/, rows: [{ 'number of rows inserted': 1 }] });
    await runAction({ action: insertMultipleRowsAction, propsValue: { ...table, rows: [{ name: 'Alice' }] } });
    expect(lastCall().sql).toBe('INSERT INTO DB.PUBLIC.ORDERS ("name") VALUES (?)');
  });

  it('update_row refuses an empty WHERE unless confirmed', async () => {
    await expect(runAction({ action: updateRowAction, propsValue: { ...table, table_update_values: { STATUS: 'x' }, where_clause: '' } })).rejects.toThrow('every row');
    respond({ match: /UPDATE/, rows: [{ 'number of rows updated': 3 }] });
    const out = await runAction({ action: updateRowAction, propsValue: { ...table, table_update_values: { STATUS: 'x', EMPTY: '' }, where_clause: 'ID > 1' } });
    expect(lastCall()).toEqual({ sql: 'UPDATE DB.PUBLIC.ORDERS SET STATUS = ? WHERE ID > 1', binds: ['x'] });
    expect(out).toEqual({ success: true, rows_updated: 3 });
    await runAction({ action: updateRowAction, propsValue: { ...table, table_update_values: { STATUS: 'x' }, update_all_rows: true } });
    expect(lastCall().sql).toBe('UPDATE DB.PUBLIC.ORDERS SET STATUS = ?');
  });

  it('delete_row requires a condition', async () => {
    await expect(runAction({ action: deleteRowAction, propsValue: { ...table, where_clause: ' ' } })).rejects.toThrow('required');
    respond({ match: /DELETE/, rows: [{ 'number of rows deleted': 2 }] });
    expect(await runAction({ action: deleteRowAction, propsValue: { ...table, where_clause: 'ID = 1' } })).toEqual({ success: true, rows_deleted: 2 });
    expect(lastCall().sql).toBe('DELETE FROM DB.PUBLIC.ORDERS WHERE ID = 1');
  });

  it('upsert_row merges on the match column', async () => {
    respond({ match: /MERGE/, rows: [{ 'number of rows inserted': 0, 'number of rows updated': 1 }] });
    const out = await runAction({ action: upsertRowAction, propsValue: { ...table, match_column: 'ID', table_column_values: { ID: '7', NAME: 'Jo' } } });
    expect(lastCall().sql).toContain('MERGE INTO DB.PUBLIC.ORDERS AS target');
    expect(lastCall().binds).toEqual(['7', 'Jo']);
    expect(out).toEqual({ success: true, rows_inserted: 0, rows_updated: 1 });
    await expect(runAction({ action: upsertRowAction, propsValue: { ...table, match_column: 'ID', table_column_values: { NAME: 'Jo' } } })).rejects.toThrow('must be included');
  });

  it('get_row_by_id spreads the row', async () => {
    respond({ match: /SELECT/, rows: [{ ID: 7, NAME: 'Jo' }] });
    expect(await runAction({ action: getRowByIdAction, propsValue: { ...table, id_column: 'ID', id_value: '7' } })).toEqual({ found: true, ID: 7, NAME: 'Jo' });
    expect(lastCall()).toEqual({ sql: 'SELECT * FROM DB.PUBLIC.ORDERS WHERE ID = ? LIMIT 1', binds: ['7'] });
    resetSnowflake();
    expect(await runAction({ action: getRowByIdAction, propsValue: { ...table, id_column: 'ID', id_value: '8' } })).toEqual({ found: false });
  });

  it('search_rows bounds the limit', async () => {
    respond({ match: /SELECT/, rows: [{ ID: 1 }] });
    await runAction({ action: searchRowsAction, propsValue: { ...table, where_clause: "S = 'a'", order_by: 'ID DESC', limit: 5 } });
    expect(lastCall().sql).toBe("SELECT * FROM DB.PUBLIC.ORDERS WHERE S = 'a' ORDER BY ID DESC LIMIT 5");
    await expect(runAction({ action: searchRowsAction, propsValue: { ...table, limit: 50000 } })).rejects.toThrow('between 1 and 10000');
  });

  it('get_table_schema maps DESCRIBE output', async () => {
    respond({ match: /DESCRIBE/, rows: [{ name: 'ID', type: 'NUMBER(38,0)', 'null?': 'N', 'primary key': 'Y' }] });
    const out = await runAction({ action: getTableSchemaAction, propsValue: table });
    expect(lastCall().sql).toBe('DESCRIBE TABLE DB.PUBLIC.ORDERS');
    expect(out).toMatchObject({ table: 'DB.PUBLIC.ORDERS', columns: [{ column_name: 'ID', data_type: 'NUMBER(38,0)', nullable: 'N', primary_key: 'Y' }] });
  });

  it('list_tables maps SHOW TABLES', async () => {
    respond({ match: /SHOW TABLES/, rows: [{ name: 'ORDERS', database_name: 'DB', schema_name: 'PUBLIC', created_on: new Date('2026-01-01T00:00:00Z') }] });
    const out = await runAction({ action: listTablesAction, propsValue: { database: 'DB', schema: 'PUBLIC' } });
    expect(lastCall().sql).toBe('SHOW TABLES IN SCHEMA DB.PUBLIC');
    expect(out).toEqual([expect.objectContaining({ table_name: 'ORDERS', created_on: '2026-01-01T00:00:00.000Z' })]);
  });

  it('execute_stored_procedure strips the signature and binds args', async () => {
    respond({ match: /CALL/, rows: [{ MY_PROC: 'ok' }] });
    const out = await runAction({ action: executeStoredProcedureAction, propsValue: { database: 'DB', schema: 'PUBLIC', procedure_name: 'MY_PROC(NUMBER) RETURN VARCHAR', arguments: [1, { a: 1 }] } });
    expect(lastCall()).toEqual({ sql: 'CALL DB.PUBLIC.MY_PROC(?, PARSE_JSON(?))', binds: [1, '{"a":1}'] });
    expect(out).toEqual({ result: [{ MY_PROC: 'ok' }] });
  });

  it('execute_stored_procedure sends text args for VARIANT params through PARSE_JSON', async () => {
    respond({ match: /CALL/, rows: [{ P1: 'ok' }] });
    await runAction({ action: executeStoredProcedureAction, propsValue: { database: 'DB', schema: 'PUBLIC', procedure_name: 'P1(NUMBER, VARIANT, OBJECT, VARCHAR) RETURN VARCHAR', arguments: [8, '{"b":2}', 'plain', '{"c":3}'] } });
    expect(lastCall()).toEqual({ sql: 'CALL DB.PUBLIC.P1(?, PARSE_JSON(?), PARSE_JSON(?), ?)', binds: [8, '{"b":2}', '"plain"', '{"c":3}'] });
  });

  it('create_dynamic_table validates the target lag', async () => {
    await expect(
      runAction({ action: createDynamicTableAction, propsValue: { database: 'DB', schema: 'PUBLIC', table_name: 'D', target_lag: "1 hour'", warehouse: 'WH', query: 'SELECT 1' } })
    ).rejects.toThrow('Refresh Interval');
    const out = await runAction({ action: createDynamicTableAction, propsValue: { database: 'DB', schema: 'PUBLIC', table_name: 'D', target_lag: 'downstream', query: 'SELECT 1' } });
    expect(lastCall().sql).toContain('TARGET_LAG = DOWNSTREAM');
    expect(lastCall().sql).toContain('WAREHOUSE = AP_TEST_WH');
    expect(out).toMatchObject({ success: true, table: 'DB.PUBLIC.D' });
  });

  it('load_data_from_stage reports zero files when Snowflake returns only a status row', async () => {
    respond({ match: /COPY/, rows: [{ status: 'Copy executed with 0 files processed.' }] });
    const out = await runAction({ action: loadDataFromStageAction, propsValue: { ...table, stage_path: '@s/', file_format_type: 'CSV' } });
    expect(out).toEqual({ success: true, files_processed: 0, rows_loaded: 0, files: [] });
  });

  it('load_data_from_stage builds a safe COPY INTO and sums rows', async () => {
    respond({ match: /COPY/, rows: [
      { file: 'a.csv', status: 'LOADED', rows_loaded: 2 },
      { file: 'b.csv', status: 'LOADED', rows_loaded: 3 },
    ] });
    const out = await runAction({ action: loadDataFromStageAction, propsValue: { ...table, stage_path: '@my_stage/data/', file_format_type: 'CSV', skip_header: 1, on_error: 'CONTINUE' } });
    expect(lastCall().sql).toBe(
      "COPY INTO DB.PUBLIC.ORDERS FROM @my_stage/data/ FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1) ON_ERROR = 'CONTINUE'"
    );
    expect(out).toMatchObject({ success: true, files_processed: 2, rows_loaded: 5 });
    await runAction({ action: loadDataFromStageAction, propsValue: { ...table, stage_path: "@s'; DROP", file_format_type: 'CSV' } });
    expect(lastCall().sql).toContain(`FROM @"s'; DROP" FILE_FORMAT`);
  });
});
