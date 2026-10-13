import sql from 'mssql';
import { describe, expect, it } from 'vitest';
import { MssqlColumn, MssqlTableMeta, MssqlTable } from '.';
import { CURSOR_LAYOUT, cursorUtils } from './cursor';

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

const plannedDescending = () =>
  cursorUtils.planCursor({ meta: meta(), propsValue: descending });

describe('value round trip', () => {
  it('renders datetime2 at full precision, not through a JavaScript Date', () => {
    expect(cursorUtils.cursorText(updatedAt)).toBe(
      'CONVERT(varchar(max), [updated_at], 126)'
    );
    expect(
      cursorUtils.cursorBind({ column: updatedAt, parameter: '@p0' })
    ).toBe('CONVERT(datetime2(7), @p0, 126)');
  });

  it('keeps a bigint exact rather than passing it through Number', () => {
    expect(cursorUtils.cursorText(id)).toBe('CONVERT(nvarchar(max), [id])');
    expect(cursorUtils.cursorBind({ column: id, parameter: '@p1' })).toBe(
      'CONVERT(bigint, @p1)'
    );
  });

  it('carries binary and rowversion as hex, which needs style 1 both ways', () => {
    const version = column('row_version', 'timestamp');
    expect(cursorUtils.cursorText(version)).toBe(
      'CONVERT(varchar(max), CONVERT(binary(8), [row_version]), 1)'
    );
    expect(cursorUtils.cursorBind({ column: version, parameter: '@p0' })).toBe(
      'CONVERT(binary(8), @p0, 1)'
    );
  });

  it('renders all four of money\'s decimals, which the default style drops', () => {
    const price = column('price', 'money', { precision: 19, scale: 4 });
    expect(cursorUtils.cursorText(price)).toBe(
      'CONVERT(varchar(max), [price], 2)'
    );
    expect(cursorUtils.cursorBind({ column: price, parameter: '@p0' })).toBe(
      'CONVERT(money, @p0)'
    );
  });

  it('renders a float to enough digits to round-trip a double', () => {
    const ratio = column('ratio', 'float');
    expect(cursorUtils.cursorText(ratio)).toBe(
      'CONVERT(varchar(max), [ratio], 3)'
    );
    expect(cursorUtils.cursorBind({ column: ratio, parameter: '@p0' })).toBe(
      'CONVERT(float, @p0)'
    );
  });

  it('renders a plain varbinary through the same path', () => {
    const blob = column('digest', 'varbinary', { maxLength: 32 });
    expect(cursorUtils.cursorText(blob)).toBe(
      'CONVERT(varchar(max), CONVERT(varbinary(32), [digest]), 1)'
    );
    expect(cursorUtils.cursorBind({ column: blob, parameter: '@p0' })).toBe(
      'CONVERT(varbinary(32), @p0, 1)'
    );
  });

  it('keeps the stored offset on a datetimeoffset instead of shifting to UTC', () => {
    const seenAt = column('seen_at', 'datetimeoffset', { scale: 7 });
    expect(cursorUtils.cursorText(seenAt)).toBe(
      'CONVERT(varchar(max), [seen_at], 126)'
    );
    expect(cursorUtils.cursorBind({ column: seenAt, parameter: '@p0' })).toBe(
      'CONVERT(datetimeoffset(7), @p0, 126)'
    );
  });

  it('sends a styled value as varchar, since hex cannot be parsed from nvarchar', () => {
    expect(
      cursorUtils.cursorParamType(column('row_version', 'timestamp')).type
    ).toBe(sql.VarChar);
    expect(cursorUtils.cursorParamType(updatedAt).type).toBe(sql.VarChar);
    expect(cursorUtils.cursorParamType(email).type).toBe(sql.NVarChar);
    expect(cursorUtils.cursorParamType(id).type).toBe(sql.NVarChar);
  });

  it('halves max_length for national character types', () => {
    expect(
      cursorUtils.declaredType(column('sku', 'nvarchar', { maxLength: 100 }))
    ).toBe('nvarchar(50)');
    expect(
      cursorUtils.declaredType(column('note', 'nvarchar', { maxLength: -1 }))
    ).toBe('nvarchar(max)');
  });

  it('refuses a type whose value cannot be saved as a position', () => {
    expect(() =>
      cursorUtils.declaredType(column('shape', 'geography'))
    ).toThrow(/not supported/);
  });
});

describe('row projection', () => {
  it('renders a datetimeoffset row value with its offset, not as UTC', () => {
    const seenAt = column('seen_at', 'datetimeoffset', { scale: 7 });
    expect(cursorUtils.exactColumn({ column: seenAt })).toBe(
      'CONVERT(varchar(max), [seen_at], 126) AS [seen_at]'
    );
  });

  it('leaves a type the driver reads exactly as a bare column', () => {
    expect(cursorUtils.exactColumn({ column: id })).toBe('[id]');
  });

  it('renders the whole date family as text, so one row is not part string part Date', () => {
    for (const type of [
      'datetime2',
      'datetimeoffset',
      'datetime',
      'smalldatetime',
      'date',
      'time',
    ]) {
      expect(
        cursorUtils.exactColumn({ column: column('at', type, { scale: 7 }) })
      ).toContain('CONVERT(varchar(max)');
    }
  });

  it('renders every type the driver would round as text', () => {
    for (const type of ['decimal', 'numeric', 'money', 'smallmoney']) {
      expect(
        cursorUtils.exactColumn({
          column: column('amount', type, { precision: 19, scale: 4 }),
        })
      ).toContain('CONVERT(varchar(max)');
    }
  });

  it('qualifies an OUTPUT projection with its pseudo-table', () => {
    expect(
      cursorUtils.exactColumn({ column: updatedAt, prefix: 'INSERTED' })
    ).toBe('CONVERT(varchar(max), INSERTED.[updated_at], 126) AS [updated_at]');
  });
});

describe('mode selection', () => {
  it('uses a keyset when an ascending identity backs the table', () => {
    const plan = plannedDescending();
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'id']);
  });

  it('falls back to the declared key when there is no identity', () => {
    const plan = cursorUtils.planCursor({
      meta: meta({ identity: undefined, keyColumns: ['id'] }),
      propsValue: descending,
    });
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'id']);
  });

  it('drops to group mode with no key at all', () => {
    const plan = cursorUtils.planCursor({
      meta: meta({ identity: undefined, keyColumns: [] }),
      propsValue: descending,
    });
    expect(plan.mode).toBe('group');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at']);
  });

  it('keysets on a string key, since the unique index makes it a total order', () => {
    expect(cursorUtils.isTiebreakType(email)).toBe(true);
    const plan = cursorUtils.planCursor({
      meta: meta({ identity: undefined, keyColumns: ['email'] }),
      propsValue: descending,
    });
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['updated_at', 'email']);
  });

  it('refuses a key on a max type, which ORDER BY rejects', () => {
    const blob = column('blob', 'varbinary', { maxLength: -1 });
    expect(cursorUtils.isTiebreakType(blob)).toBe(false);
    const plan = cursorUtils.planCursor({
      meta: meta({
        columns: [updatedAt, blob],
        identity: undefined,
        keyColumns: ['blob'],
      }),
      propsValue: descending,
    });
    expect(plan.mode).toBe('group');
  });

  it('refuses group mode on a string ordering column', () => {
    expect(() =>
      cursorUtils.planCursor({
        meta: meta({
          columns: [email],
          identity: undefined,
          keyColumns: [],
        }),
        propsValue: { table, order_by: 'email', order_direction: 'DESC' },
      })
    ).toThrow(/no primary key or unique constraint/);
  });

  it('needs no tiebreaker when ordering by the identity itself', () => {
    const plan = cursorUtils.planCursor({
      meta: meta(),
      propsValue: {
        table,
        order_by: 'id',
        order_direction: 'DESC',
      },
    });
    expect(plan.mode).toBe('keyset');
    expect(plan.columns.map((c) => c.name)).toEqual(['id']);
  });

  it('rejects a column that has since been dropped', () => {
    expect(() =>
      cursorUtils.planCursor({
        meta: meta(),
        propsValue: { ...descending, order_by: 'gone' },
      })
    ).toThrow(/no longer exists/);
  });

  it('rejects a table that would collide with the position aliases', () => {
    expect(() =>
      cursorUtils.planCursor({
        meta: meta({
          columns: [updatedAt, id, column(`${cursorUtils.alias(0)}`, 'int')],
        }),
        propsValue: descending,
      })
    ).toThrow(/reserves/);
  });

  it('rejects an unset order direction', () => {
    expect(() =>
      cursorUtils.planCursor({
        meta: meta(),
        propsValue: {
          table,
          order_by: 'updated_at',
          order_direction: undefined,
        },
      })
    ).toThrow(/Invalid order direction/);
  });
});

describe('order column offered to the user', () => {
  it('offers a string column when a key makes it a keyset tiebreaker', () => {
    expect(
      cursorUtils.isOrderable({
        meta: meta(),
        column: email,
      })
    ).toBe(true);
  });

  it('refuses a string column on a table with no key, which planCursor rejects', () => {
    const keyless = meta({ identity: undefined, keyColumns: [] });
    expect(cursorUtils.isOrderable({ meta: keyless, column: email })).toBe(
      false
    );
    expect(() =>
      cursorUtils.planCursor({
        meta: keyless,
        propsValue: { table, order_by: 'email', order_direction: 'DESC' },
      })
    ).toThrow(/no primary key or unique constraint/);
  });

  it('still offers a groupable column on a table with no key', () => {
    const keyless = meta({ identity: undefined, keyColumns: [] });
    expect(cursorUtils.isOrderable({ meta: keyless, column: updatedAt })).toBe(
      true
    );
  });

  it('refuses a max type, which ORDER BY rejects', () => {
    expect(
      cursorUtils.isOrderable({
        meta: meta(),
        column: column('note', 'nvarchar', { maxLength: -1 }),
      })
    ).toBe(false);
  });
});

describe('drain direction', () => {
  it('walks upward when the newest rows carry the largest values', () => {
    const plan = plannedDescending();
    expect(plan.drain).toBe('ASC');
    expect(plan.ahead).toBe('>');
  });

  it('walks downward when the newest rows carry the smallest values', () => {
    const plan = cursorUtils.planCursor({
      meta: meta(),
      propsValue: { ...descending, order_direction: 'ASC' },
    });
    expect(plan.drain).toBe('DESC');
    expect(plan.ahead).toBe('<');
  });

  it('baselines at the head, which is the reverse of the drain', () => {
    expect(cursorUtils.baselineQuery(plannedDescending())).toContain(
      'ORDER BY [dbo].[orders].[updated_at] DESC, [dbo].[orders].[id] DESC'
    );
  });
});

describe('sample data', () => {
  it('projects the preview exactly as a delivered row, not as SELECT *', () => {
    const query = cursorUtils.previewQuery(plannedDescending());
    expect(query).toContain(
      'CONVERT(varchar(max), [updated_at], 126) AS [updated_at]'
    );
    expect(query).not.toContain('SELECT TOP (@limit) *');
  });

  it('reads the head, and carries no position bookkeeping', () => {
    const query = cursorUtils.previewQuery(plannedDescending());
    expect(query).toContain(
      'ORDER BY [dbo].[orders].[updated_at] DESC, [dbo].[orders].[id] DESC'
    );
    expect(query).not.toContain(cursorUtils.alias(0));
  });
});

describe('keyset page query', () => {
  const plan = plannedDescending();
  const position = ['2026-01-01T00:00:00.0000000', '5'];

  it('orders in drain order so a backlog is walked, not jumped over', () => {
    expect(cursorUtils.keysetPageQuery({ plan, position })).toContain(
      'ORDER BY [dbo].[orders].[updated_at] ASC, [dbo].[orders].[id] ASC'
    );
  });

  it('expands the keyset lexicographically, since T-SQL has no row comparison', () => {
    expect(cursorUtils.keysetPageQuery({ plan, position })).toContain(
      '(([updated_at] > CONVERT(datetime2(7), @p0, 126)) OR ' +
        '([updated_at] = CONVERT(datetime2(7), @p0, 126) AND [id] > CONVERT(bigint, @p1)))'
    );
  });

  it('expands a composite key one term per column', () => {
    const composite = cursorUtils.planCursor({
      meta: meta({
        columns: [updatedAt, column('tenant_id', 'int'), email],
        identity: undefined,
        keyColumns: ['tenant_id', 'email'],
      }),
      propsValue: descending,
    });
    const query = cursorUtils.keysetPageQuery({
      plan: composite,
      position: ['t', '1', 'a@b.c'],
    });
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
    const query = cursorUtils.keysetPageQuery({ plan, position });
    expect(query).toContain('@p0');
    expect(query).toContain('@p1');
    expect(query).not.toContain('@p2');
  });

  it('drops the keyset entirely when nothing has been delivered yet', () => {
    const query = cursorUtils.keysetPageQuery({ plan, position: null });
    expect(query).not.toContain('@p0');
    expect(query).toContain('WHERE [updated_at] IS NOT NULL');
  });

  it('always excludes a NULL ordering value', () => {
    expect(cursorUtils.keysetPageQuery({ plan, position })).toContain(
      '[updated_at] IS NOT NULL'
    );
  });
});

describe('group page query', () => {
  const grouped = cursorUtils.planCursor({
    meta: meta({ identity: undefined, keyColumns: [] }),
    propsValue: descending,
  });

  it('bounds on the ordering value alone and fills a whole page', () => {
    const query = cursorUtils.groupPageQuery({
      plan: grouped,
      position: ['2026-01-01T00:00:00.0000000'],
    });
    expect(query).toContain(
      'WHERE [updated_at] IS NOT NULL AND [updated_at] > CONVERT(datetime2(7), @p0, 126)'
    );
    expect(query).toContain('ORDER BY [dbo].[orders].[updated_at] ASC');
  });

  it('walks downward when the newest rows carry the smallest values', () => {
    const upward = cursorUtils.planCursor({
      meta: meta({ identity: undefined, keyColumns: [] }),
      propsValue: { ...descending, order_direction: 'ASC' },
    });
    const query = cursorUtils.groupPageQuery({
      plan: upward,
      position: ['2026-01-01T00:00:00.0000000'],
    });
    expect(query).toContain('[updated_at] < CONVERT(datetime2(7), @p0, 126)');
    expect(query).toContain('ORDER BY [dbo].[orders].[updated_at] DESC');
  });

  it('can ask for one exact ordering value, for a value bigger than a page', () => {
    expect(cursorUtils.groupValueQuery(grouped)).toContain(
      'WHERE [updated_at] = CONVERT(datetime2(7), @p0, 126)'
    );
  });
});

describe('group page trimming', () => {
  const grouped = cursorUtils.planCursor({
    meta: meta({ identity: undefined, keyColumns: [] }),
    propsValue: descending,
  });
  const at = (value: string) => ({ [cursorUtils.alias(0)]: value });

  it('delivers everything when the extra row never arrived', () => {
    const rows = [at('a'), at('b'), at('c')];
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows, limit: 3 })
    ).toEqual({
      ready: rows,
      oversized: null,
    });
  });

  it('leaves the trailing value behind, since it may have been cut in half', () => {
    const rows = [at('a'), at('b'), at('c'), at('c')];
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows, limit: 3 })
    ).toEqual({
      ready: [at('a'), at('b')],
      oversized: null,
    });
  });

  it('trims a trailing value that is a single row', () => {
    const rows = [at('a'), at('b'), at('c'), at('d')];
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows, limit: 3 })
    ).toEqual({
      ready: [at('a'), at('b'), at('c')],
      oversized: null,
    });
  });

  it('flags a value that fills the whole page on its own', () => {
    const rows = [at('a'), at('a'), at('a'), at('a')];
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows, limit: 3 })
    ).toEqual({
      ready: [],
      oversized: 'a',
    });
  });

  it('delivers a value that exactly fills the page without flagging it', () => {
    const rows = [at('a'), at('a'), at('a')];
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows, limit: 3 })
    ).toEqual({
      ready: rows,
      oversized: null,
    });
  });

  it('handles an empty page', () => {
    expect(
      cursorUtils.completeGroups({ plan: grouped, rows: [], limit: 3 })
    ).toEqual({
      ready: [],
      oversized: null,
    });
  });
});

describe('position handling', () => {
  const plan = plannedDescending();
  const row = {
    id: 5,
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    [cursorUtils.alias(0)]: '2026-01-01T00:00:00.1234567',
    [cursorUtils.alias(1)]: '9007199254740993',
  };

  it('reads the position from the projected text, not from the row values', () => {
    expect(cursorUtils.positionOf({ plan, row })).toEqual([
      '2026-01-01T00:00:00.1234567',
      '9007199254740993',
    ]);
  });

  it('keeps the payload free of its own bookkeeping columns', () => {
    expect(cursorUtils.stripPosition({ plan, row })).toEqual({
      id: 5,
      updated_at: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('refuses to build a position out of a missing value', () => {
    expect(() =>
      cursorUtils.positionOf({ plan, row: { [cursorUtils.alias(0)]: 'x' } })
    ).toThrow(/Could not read a polling position/);
  });
});

describe('reconcile', () => {
  const plan = plannedDescending();
  const grouped = cursorUtils.planCursor({
    meta: meta({ identity: undefined, keyColumns: [] }),
    propsValue: descending,
  });

  it('accepts a position rendered from the same columns', () => {
    const cursor = cursorUtils.newCursor({ plan, position: ['a', 'b'] });
    expect(cursorUtils.reconcile({ stored: cursor, plan })).toBe(cursor);
  });

  it('accepts a null position', () => {
    const cursor = cursorUtils.newCursor({ plan, position: null });
    expect(cursorUtils.reconcile({ stored: cursor, plan })).toBe(cursor);
  });

  it('discards a position from a different column list', () => {
    expect(
      cursorUtils.reconcile({
        stored: cursorUtils.newCursor({ plan: grouped, position: ['a'] }),
        plan,
      })
    ).toBeNull();
  });

  it('discards a position from a different mode', () => {
    const crossed = {
      ...cursorUtils.newCursor({ plan, position: ['a', 'b'] }),
      m: 'group' as const,
    };
    expect(cursorUtils.reconcile({ stored: crossed, plan })).toBeNull();
  });

  it('keeps a position from an older layout that renders it the same way', () => {
    const stale = {
      ...cursorUtils.newCursor({ plan, position: ['a', 'b'] }),
      v: CURSOR_LAYOUT - 1,
    };
    expect(cursorUtils.reconcile({ stored: stale, plan })).toBe(stale);
  });

  it('discards a position from the layout that rendered datetimeoffset in UTC', () => {
    const offsetAt = column('offset_at', 'datetimeoffset', { scale: 7 });
    const offsetPlan = cursorUtils.planCursor({
      meta: meta({ columns: [offsetAt, id, email] }),
      propsValue: { ...descending, order_by: 'offset_at' },
    });
    const stale = {
      ...cursorUtils.newCursor({
        plan: offsetPlan,
        position: ['2026-01-15T05:30:00.1234567Z', '1'],
      }),
      v: CURSOR_LAYOUT - 1,
    };
    expect(
      cursorUtils.reconcile({ stored: stale, plan: offsetPlan })
    ).toBeNull();
  });

  it('keeps an empty baseline from the layout that rendered datetimeoffset in UTC', () => {
    const offsetAt = column('offset_at', 'datetimeoffset', { scale: 7 });
    const offsetPlan = cursorUtils.planCursor({
      meta: meta({ columns: [offsetAt, id, email] }),
      propsValue: { ...descending, order_by: 'offset_at' },
    });
    const stale = {
      ...cursorUtils.newCursor({ plan: offsetPlan, position: null }),
      v: CURSOR_LAYOUT - 1,
    };
    expect(cursorUtils.reconcile({ stored: stale, plan: offsetPlan })).toBe(
      stale
    );
  });

  it('discards an empty baseline from a layout it knows nothing about', () => {
    for (const v of [0, CURSOR_LAYOUT + 1]) {
      const alien = {
        ...cursorUtils.newCursor({ plan, position: null }),
        v,
      };
      expect(cursorUtils.reconcile({ stored: alien, plan })).toBeNull();
    }
  });

  it('discards a position from a layout it knows nothing about', () => {
    for (const v of [0, CURSOR_LAYOUT + 1]) {
      const alien = {
        ...cursorUtils.newCursor({ plan, position: ['a', 'b'] }),
        v,
      };
      expect(cursorUtils.reconcile({ stored: alien, plan })).toBeNull();
    }
  });

  it('discards a position whose length no longer matches', () => {
    const short = {
      ...cursorUtils.newCursor({ plan, position: ['a', 'b'] }),
      k: ['a'],
    };
    expect(cursorUtils.reconcile({ stored: short, plan })).toBeNull();
  });

  it('discards a missing position', () => {
    expect(cursorUtils.reconcile({ stored: null, plan })).toBeNull();
  });
});
