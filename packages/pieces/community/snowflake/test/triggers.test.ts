import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callHook, lastCall, memoryStore, customAuth, resetSnowflake, respond, userCalls } from './helpers';

vi.mock('snowflake-sdk', async () => (await import('./helpers')).fakeSdk);

import { newRowTrigger } from '../src/lib/triggers/new-row';
import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row';
import { newTableTrigger } from '../src/lib/triggers/new-table';
import { newViewTrigger } from '../src/lib/triggers/new-view';
import { newColumnTrigger } from '../src/lib/triggers/new-column';

function context({ propsValue, store = memoryStore().store }: { propsValue: Record<string, unknown>; store?: ReturnType<typeof memoryStore>['store'] }) {
  return { auth: customAuth, propsValue, store, setSchedule: () => undefined };
}

function rowsWithCursor(cursors: number[]) {
  return cursors.map((c, i) => ({ ID: i, __AP_CURSOR: c }));
}

function hookOf({ trigger, hook }: { trigger: object; hook: 'onEnable' | 'onDisable' | 'run' | 'test' }) {
  return (ctx: unknown) => callHook({ trigger, hook, context: ctx });
}

beforeEach(() => resetSnowflake());

describe.each([
  ['new_row', newRowTrigger, 'created_at_column'],
  ['new_or_updated_row', newOrUpdatedRowTrigger, 'updated_at_column'],
])('%s', (_name, trigger, columnProp) => {
  const props = { database: 'DB', schema: 'PUBLIC', table: 'DB.PUBLIC.T', [columnProp]: 'TS' };

  it('stores a baseline on enable and emits nothing old', async () => {
    const mem = memoryStore();
    respond({ match: /MAX\(/, rows: [{ __AP_CURSOR: 1700000000000000 }] });
    await hookOf({ trigger: trigger, hook: 'onEnable' })(context({ propsValue: props, store: mem.store }));
    expect(lastCall().sql).toBe('SELECT MAX(DATE_PART(EPOCH_MICROSECOND, TS)) AS "__AP_CURSOR" FROM DB.PUBLIC.T');
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '1700000000000000' });
  });

  it('pages forward from the stored cursor in ascending order', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '100' });
    respond({ match: /WHERE DATE_PART/, rows: rowsWithCursor([101, 102]) });
    const out = await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }));
    expect(lastCall()).toEqual({
      sql: 'SELECT t.*, DATE_PART(EPOCH_MICROSECOND, TS) AS "__AP_CURSOR" FROM DB.PUBLIC.T t WHERE DATE_PART(EPOCH_MICROSECOND, TS) > ? ORDER BY DATE_PART(EPOCH_MICROSECOND, TS) ASC LIMIT 1000',
      binds: ['100'],
    });
    expect(out).toEqual([{ ID: 0 }, { ID: 1 }]);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '102' });
  });

  it('holds back trailing ties on a full page so none are lost', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '1' });
    const cursors = Array.from({ length: 1000 }, (_, i) => (i < 998 ? 10 + i : 5000));
    respond({ match: /> \? ORDER/, rows: rowsWithCursor(cursors) });
    const out = await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }));
    expect(out).toHaveLength(998);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: String(10 + 997) });
  });

  it('fetches the whole group when a full page shares one timestamp', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '1' });
    respond({ match: /> \? ORDER/, rows: rowsWithCursor(Array.from({ length: 1000 }, () => 50)) });
    respond({ match: /= \? LIMIT/, rows: rowsWithCursor(Array.from({ length: 1500 }, () => 50)) });
    const out = await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }));
    expect(lastCall()).toEqual({
      sql: 'SELECT t.*, DATE_PART(EPOCH_MICROSECOND, TS) AS "__AP_CURSOR" FROM DB.PUBLIC.T t WHERE DATE_PART(EPOCH_MICROSECOND, TS) = ? LIMIT 10000',
      binds: ['50'],
    });
    expect(out).toHaveLength(1500);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '50' });
  });

  it('never re-reads rows at the saved timestamp, so edits to emitted rows do not re-fire', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '10' });
    respond({ match: /> \? ORDER/, rows: [{ ID: 1, __AP_CURSOR: 20 }] });
    const out = await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }));
    expect(out).toEqual([{ ID: 1 }]);
    expect(lastCall().sql).toContain('TS) > ? ORDER BY');
    expect(lastCall().sql).not.toContain('HASH');
  });

  it('keeps the saved cursor on republish', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '7' });
    await hookOf({ trigger: trigger, hook: 'onEnable' })({ ...context({ propsValue: props, store: mem.store }), isRepublish: true });
    expect(userCalls()).toHaveLength(0);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '7' });
  });

  it('keeps the cursor when nothing is new', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '5' });
    expect(await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }))).toEqual([]);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '5' });
  });

  it('first run without state stores a baseline and emits nothing', async () => {
    const mem = memoryStore();
    respond({ match: /MAX\(/, rows: [{ __AP_CURSOR: null }] });
    expect(await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }))).toEqual([]);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: null });
    respond({ match: /IS NOT NULL ORDER BY DATE_PART/, rows: rowsWithCursor([3]) });
    expect(await hookOf({ trigger: trigger, hook: 'run' })(context({ propsValue: props, store: mem.store }))).toEqual([{ ID: 0 }]);
    expect(lastCall().sql).toContain('WHERE TS IS NOT NULL ORDER BY');
  });

  it('test returns the latest rows', async () => {
    respond({ match: /DESC LIMIT 5/, rows: [{ ID: 9 }] });
    expect(await hookOf({ trigger: trigger, hook: 'test' })(context({ propsValue: props }))).toEqual([{ ID: 9 }]);
    expect(lastCall().sql).toBe('SELECT * FROM DB.PUBLIC.T WHERE TS IS NOT NULL ORDER BY TS DESC LIMIT 5');
  });

  it('keeps the cursor across disable then republish enable', async () => {
    const mem = memoryStore();
    mem.data.set('snowflake_row_cursor', { cursor: '5' });
    await hookOf({ trigger: trigger, hook: 'onDisable' })(context({ propsValue: props, store: mem.store }));
    await hookOf({ trigger: trigger, hook: 'onEnable' })({ ...context({ propsValue: props, store: mem.store }), isRepublish: true });
    expect(userCalls()).toHaveLength(0);
    expect(mem.data.get('snowflake_row_cursor')).toEqual({ cursor: '5' });
  });
});

describe('catalog triggers', () => {
  it('new_table polls SHOW TABLES with a quoted scope', async () => {
    respond({ match: /SHOW TABLES/, rows: [{ name: 'ORDERS', created_on: '2026-01-01T00:00:00Z' }] });
    const out = await hookOf({ trigger: newTableTrigger, hook: 'test' })(context({ propsValue: { database: 'DB', schema: 'my schema' } }));
    expect(lastCall().sql).toBe('SHOW TABLES IN SCHEMA DB."my schema"');
    expect(out).toEqual([expect.objectContaining({ table_name: 'ORDERS' })]);
  });

  it('new_view polls SHOW VIEWS', async () => {
    respond({ match: /SHOW VIEWS/, rows: [{ name: 'V', created_on: '2026-01-01T00:00:00Z' }] });
    const out = await hookOf({ trigger: newViewTrigger, hook: 'test' })(context({ propsValue: { database: 'DB', schema: 'PUBLIC' } }));
    expect(out).toEqual([expect.objectContaining({ view_name: 'V' })]);
  });

  it('new_column describes the table', async () => {
    respond({ match: /DESCRIBE/, rows: [{ name: 'ID', type: 'NUMBER' }, { name: 'EMAIL', type: 'VARCHAR' }] });
    const out = await hookOf({ trigger: newColumnTrigger, hook: 'test' })(context({ propsValue: { database: 'DB', schema: 'PUBLIC', table: 'DB.PUBLIC.T' } }));
    expect(lastCall().sql).toBe('DESCRIBE TABLE DB.PUBLIC.T');
    expect(out).toMatchObject([{ column_name: 'EMAIL' }, { column_name: 'ID' }]);
    expect(userCalls()).toHaveLength(1);
  });
});
