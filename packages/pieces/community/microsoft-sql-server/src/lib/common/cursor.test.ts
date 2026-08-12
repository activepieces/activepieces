import sql from 'mssql';
import { describe, expect, it } from 'vitest';
import { MssqlColumn, MssqlTableMeta, MssqlTable } from '.';
import {
  CURSOR_LAYOUT,
  alias,
  baselineQuery,
  completeGroups,
  cursorBind,
  cursorParamType,
  cursorText,
  declaredType,
  groupPageQuery,
  groupValueQuery,
  isTiebreakType,
  keysetPageQuery,
  newCursor,
  planCursor,
  positionOf,
  reconcile,
  stripPosition,
} from './cursor';

const table: MssqlTable = { table_schema: 'dbo', table_name: 'orders' };

function column(
  name: string,
  type: string,
  overrides: Partial<MssqlColumn> = {}
): MssqlColumn {
  return {
    name,
    type,
    precision: 0,
    scale: 0,
    maxLength: 8,
    nullable: false,
    ...overrides,
  };
}

const updatedAt = column('updated_at', 'datetime2', { scale: 7 });
const id = column('id', 'bigint');
const email = column('email', 'varchar', { maxLength: 200 });

function meta(overrides: Partial<MssqlTableMeta> = {}): MssqlTableMeta {
  return {
    columns: [updatedAt, id, email],
    identity: 'id',
    keyColumns: ['id'],
    ...overrides,
  };
}

const descending = { table, order_by: 'updated_at', order_direction: 'DESC' as const };

describe('value round trip', () => {
  it('renders datetime2 at full precision, not through a JavaScript Date', () => {
    // a Date would truncate 100ns ticks to milliseconds, leaving the position
    // behind the row it names and redelivering that row on every poll
    expect(cursorText(updatedAt)).toBe(
      'CONVERT(varchar(max), [updated_at], 126)'
    );
    expect(cursorBind(updatedAt, '@p0')).toBe(
      'CONVERT(datetime2(7), @p0, 126)'
    );
  });

  it('keeps a bigint exact rather than passing it through Number', () => {
    expect(cursorText(id)).toBe('CONVERT(nvarchar(max), [id])');
    expect(cursorBind(id, '@p1')).toBe('CONVERT(bigint, @p1)');
  });

  it('carries binary and rowversion as hex, which needs style 1 both ways', () => {
    const version = column('row_version', 'timestamp');
    // the inner cast is load-bearing: converting straight from a rowversion
    // ignores the style and returns raw bytes, NULs and all
    expect(cursorText(version)).toBe(
      'CONVERT(varchar(max), CONVERT(binary(8), [row_version]), 1)'
    );
    // timestamp is not a legal CONVERT target, binary(8) is
    expect(cursorBind(version, '@p0')).toBe('CONVERT(binary(8), @p0, 1)');
  });

  it('renders all four of money\'s decimals, which the default style drops', () => {
    const price = column('price', 'money', { precision: 19, scale: 4 });
    expect(cursorText(price)).toBe('CONVERT(varchar(max), [price], 2)');
    // no style coming back: CONVERT ignores one when the target is a number
    expect(cursorBind(price, '@p0')).toBe('CONVERT(money, @p0)');
  });

  it('renders a float to enough digits to round-trip a double', () => {
    const ratio = column('ratio', 'float');
    expect(cursorText(ratio)).toBe('CONVERT(varchar(max), [ratio], 3)');
    expect(cursorBind(ratio, '@p0')).toBe('CONVERT(float, @p0)');
  });

  it('renders a plain varbinary through the same path', () => {
    const blob = column('digest', 'varbinary', { maxLength: 32 });
    expect(cursorText(blob)).toBe(
      'CONVERT(varchar(max), CONVERT(varbinary(32), [digest]), 1)'
    );
    expect(cursorBind(blob, '@p0')).toBe('CONVERT(varbinary(32), @p0, 1)');
  });

  it('sends a styled value as varchar, since hex cannot be parsed from nvarchar', () => {
    // SQL Server rejects CONVERT(binary, <nvarchar>, 1) outright, and every
    // styled rendering is ASCII anyway
    expect(cursorParamType(column('row_version', 'timestamp')).type).toBe(
      sql.VarChar
    );
    expect(cursorParamType(updatedAt).type).toBe(sql.VarChar);
    // a text column may hold Unicode, so it keeps nvarchar
    expect(cursorParamType(email).type).toBe(sql.NVarChar);
    expect(cursorParamType(id).type).toBe(sql.NVarChar);
  });

  it('halves max_length for national character types', () => {
    expect(declaredType(column('sku', 'nvarchar', { maxLength: 100 }))).toBe(
      'nvarchar(50)'
    );
    expect(declaredType(column('note', 'nvarchar', { maxLength: -1 }))).toBe(
      'nvarchar(max)'
    );
  });

  it('refuses a type whose value cannot be saved as a position', () => {
    expect(() => declaredType(column('shape', 'geography'))).toThrow(
      /not supported/
    );
  });
});

describe('mode selection', () => {
  it('uses a keyset when an ascending identity backs the table', () => {
    const plan = planCursor(meta(), descending);
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'id']);
  });

  it('falls back to the declared key when there is no identity', () => {
    const plan = planCursor(
      meta({ identity: undefined, keyColumns: ['id'] }),
      descending
    );
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'id']);
  });

  it('drops to group mode with no key at all', () => {
    const plan = planCursor(
      meta({ identity: undefined, keyColumns: [] }),
      descending
    );
    expect(plan.mode).toBe('group');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at']);
  });

  it('keysets on a string key, since the unique index makes it a total order', () => {
    // the index enforces uniqueness under the same collation the comparison
    // uses, so two rows that compared equal could not both exist
    expect(isTiebreakType(email)).toBe(true);
    const plan = planCursor(
      meta({ identity: undefined, keyColumns: ['email'] }),
      descending
    );
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'email']);
  });

  it('refuses a key on a max type, which ORDER BY rejects', () => {
    const blob = column('blob', 'varbinary', { maxLength: -1 });
    expect(isTiebreakType(blob)).toBe(false);
    const plan = planCursor(
      meta({
        columns: [updatedAt, blob],
        identity: undefined,
        keyColumns: ['blob'],
      }),
      descending
    );
    expect(plan.mode).toBe('group');
  });

  it('refuses group mode on a string ordering column', () => {
    // group mode decides where a value ends by comparing rendered text, and a
    // case-insensitive collation makes that comparison disagree with the server
    expect(() =>
      planCursor(
        meta({
          columns: [email],
          identity: undefined,
          keyColumns: [],
        }),
        { table, order_by: 'email', order_direction: 'DESC' }
      )
    ).toThrow(/no primary key or unique constraint/);
  });

  it('needs no tiebreaker when ordering by the identity itself', () => {
    const plan = planCursor(meta(), {
      table,
      order_by: 'id',
      order_direction: 'DESC',
    });
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['id']);
  });

  it('rejects a column that has since been dropped', () => {
    expect(() =>
      planCursor(meta(), { ...descending, order_by: 'gone' })
    ).toThrow(/no longer exists/);
  });

  it('rejects a table that would collide with the position aliases', () => {
    expect(() =>
      planCursor(
        meta({ columns: [updatedAt, id, column(`${alias(0)}`, 'int')] }),
        descending
      )
    ).toThrow(/reserves/);
  });

  it('rejects an unset order direction', () => {
    expect(() =>
      planCursor(meta(), { table, order_by: 'updated_at', order_direction: undefined })
    ).toThrow(/Invalid order direction/);
  });
});

describe('drain direction', () => {
  it('walks upward when the newest rows carry the largest values', () => {
    const plan = planCursor(meta(), descending);
    expect(plan.drain).toBe('ASC');
    expect(plan.ahead).toBe('>');
  });

  it('walks downward when the newest rows carry the smallest values', () => {
    const plan = planCursor(meta(), { ...descending, order_direction: 'ASC' });
    expect(plan.drain).toBe('DESC');
    expect(plan.ahead).toBe('<');
  });

  it('baselines at the head, which is the reverse of the drain', () => {
    expect(baselineQuery(planCursor(meta(), descending))).toContain(
      'ORDER BY [dbo].[orders].[updated_at] DESC, [dbo].[orders].[id] DESC'
    );
  });
});

describe('keyset page query', () => {
  const plan = planCursor(meta(), descending);
  const position = ['2026-01-01T00:00:00.0000000', '5'];

  it('orders in drain order so a backlog is walked, not jumped over', () => {
    // the old design took the newest page and moved the position to its head,
    // which silently discarded every row between the old position and that page
    expect(keysetPageQuery(plan, position)).toContain(
      'ORDER BY [dbo].[orders].[updated_at] ASC, [dbo].[orders].[id] ASC'
    );
  });

  it('expands the keyset lexicographically, since T-SQL has no row comparison', () => {
    expect(keysetPageQuery(plan, position)).toContain(
      '(([updated_at] > CONVERT(datetime2(7), @p0, 126)) OR ' +
        '([updated_at] = CONVERT(datetime2(7), @p0, 126) AND [id] > CONVERT(bigint, @p1)))'
    );
  });

  it('expands a composite key one term per column', () => {
    const composite = planCursor(
      meta({
        columns: [updatedAt, column('tenant_id', 'int'), email],
        identity: undefined,
        keyColumns: ['tenant_id', 'email'],
      }),
      descending
    );
    const query = keysetPageQuery(composite, ['t', '1', 'a@b.c']);
    expect(query).toContain('([updated_at] > CONVERT(datetime2(7), @p0, 126))');
    expect(query).toContain(
      '([updated_at] = CONVERT(datetime2(7), @p0, 126) AND [tenant_id] > CONVERT(int, @p1))'
    );
    expect(query).toContain(
      '([updated_at] = CONVERT(datetime2(7), @p0, 126) AND [tenant_id] = CONVERT(int, @p1) AND [email] > CONVERT(varchar(200), @p2))'
    );
    expect(query).toContain('ORDER BY [dbo].[orders].[updated_at] ASC, [dbo].[orders].[tenant_id] ASC, [dbo].[orders].[email] ASC');
  });

  it('binds one parameter per cursor column', () => {
    const query = keysetPageQuery(plan, position);
    expect(query).toContain('@p0');
    expect(query).toContain('@p1');
    expect(query).not.toContain('@p2');
  });

  it('drops the keyset entirely when nothing has been delivered yet', () => {
    const query = keysetPageQuery(plan, null);
    // an empty table baselines to a null position, and everything is then new
    expect(query).not.toContain('@p0');
    expect(query).toContain('WHERE [updated_at] IS NOT NULL');
  });

  it('always excludes a NULL ordering value', () => {
    expect(keysetPageQuery(plan, position)).toContain(
      '[updated_at] IS NOT NULL'
    );
  });
});

describe('group page query', () => {
  const grouped = planCursor(
    meta({ identity: undefined, keyColumns: [] }),
    descending
  );

  it('bounds on the ordering value alone and fills a whole page', () => {
    // one ordering value per poll would be a single row on a fine timestamp
    const query = groupPageQuery(grouped, ['2026-01-01T00:00:00.0000000']);
    expect(query).toContain(
      'WHERE [updated_at] IS NOT NULL AND [updated_at] > CONVERT(datetime2(7), @p0, 126)'
    );
    expect(query).toContain('ORDER BY [dbo].[orders].[updated_at] ASC');
  });

  it('walks downward when the newest rows carry the smallest values', () => {
    const upward = planCursor(
      meta({ identity: undefined, keyColumns: [] }),
      { ...descending, order_direction: 'ASC' }
    );
    const query = groupPageQuery(upward, ['2026-01-01T00:00:00.0000000']);
    expect(query).toContain('[updated_at] < CONVERT(datetime2(7), @p0, 126)');
    expect(query).toContain('ORDER BY [dbo].[orders].[updated_at] DESC');
  });

  it('can ask for one exact ordering value, for a value bigger than a page', () => {
    expect(groupValueQuery(grouped)).toContain(
      'WHERE [updated_at] = CONVERT(datetime2(7), @p0, 126)'
    );
  });
});

describe('group page trimming', () => {
  const grouped = planCursor(
    meta({ identity: undefined, keyColumns: [] }),
    descending
  );
  const at = (value: string) => ({ [alias(0)]: value });

  it('delivers everything when the extra row never arrived', () => {
    const rows = [at('a'), at('b'), at('c')];
    expect(completeGroups(grouped, rows, 3)).toEqual({
      ready: rows,
      oversized: null,
    });
  });

  it('leaves the trailing value behind, since it may have been cut in half', () => {
    // 'c' could have more rows past the page, so it waits for the next poll
    const rows = [at('a'), at('b'), at('c'), at('c')];
    expect(completeGroups(grouped, rows, 3)).toEqual({
      ready: [at('a'), at('b')],
      oversized: null,
    });
  });

  it('trims a trailing value that is a single row', () => {
    const rows = [at('a'), at('b'), at('c'), at('d')];
    expect(completeGroups(grouped, rows, 3)).toEqual({
      ready: [at('a'), at('b'), at('c')],
      oversized: null,
    });
  });

  it('flags a value that fills the whole page on its own', () => {
    // trimming would leave nothing, so the caller has to fetch it complete
    const rows = [at('a'), at('a'), at('a'), at('a')];
    expect(completeGroups(grouped, rows, 3)).toEqual({
      ready: [],
      oversized: 'a',
    });
  });

  it('delivers a value that exactly fills the page without flagging it', () => {
    const rows = [at('a'), at('a'), at('a')];
    expect(completeGroups(grouped, rows, 3)).toEqual({
      ready: rows,
      oversized: null,
    });
  });

  it('handles an empty page', () => {
    expect(completeGroups(grouped, [], 3)).toEqual({
      ready: [],
      oversized: null,
    });
  });
});

describe('position handling', () => {
  const plan = planCursor(meta(), descending);
  const row = {
    id: 5,
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    [alias(0)]: '2026-01-01T00:00:00.1234567',
    [alias(1)]: '9007199254740993',
  };

  it('reads the position from the projected text, not from the row values', () => {
    expect(positionOf(plan, row)).toEqual([
      '2026-01-01T00:00:00.1234567',
      '9007199254740993',
    ]);
  });

  it('keeps the payload free of its own bookkeeping columns', () => {
    expect(stripPosition(plan, row)).toEqual({
      id: 5,
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('refuses to build a position out of a missing value', () => {
    expect(() => positionOf(plan, { [alias(0)]: 'x' })).toThrow(
      /Could not read a polling position/
    );
  });
});

describe('reconcile', () => {
  const plan = planCursor(meta(), descending);
  const grouped = planCursor(
    meta({ identity: undefined, keyColumns: [] }),
    descending
  );

  it('accepts a position rendered from the same columns', () => {
    const cursor = newCursor(plan, ['a', 'b']);
    expect(reconcile(cursor, plan)).toBe(cursor);
  });

  it('accepts a null position', () => {
    const cursor = newCursor(plan, null);
    expect(reconcile(cursor, plan)).toBe(cursor);
  });

  it('discards a position from a different column list', () => {
    expect(reconcile(newCursor(grouped, ['a']), plan)).toBeNull();
  });

  it('discards a position from a different mode', () => {
    const crossed = { ...newCursor(plan, ['a', 'b']), m: 'group' as const };
    expect(reconcile(crossed, plan)).toBeNull();
  });

  it('discards a position from an older layout', () => {
    const stale = { ...newCursor(plan, ['a', 'b']), v: CURSOR_LAYOUT - 1 };
    expect(reconcile(stale, plan)).toBeNull();
  });

  it('discards a position whose length no longer matches', () => {
    const short = { ...newCursor(plan, ['a', 'b']), k: ['a'] };
    expect(reconcile(short, plan)).toBeNull();
  });

  it('discards a missing position', () => {
    expect(reconcile(null, plan)).toBeNull();
  });
});
