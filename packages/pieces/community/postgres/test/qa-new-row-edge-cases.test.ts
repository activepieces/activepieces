import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { pgHarness, Target } from './helpers/pg-harness';

vi.mock('pg', async (importOriginal) => (await import('./helpers/pg-harness')).pgHarness.mockPg({ actual: await importOriginal() }));

import '../src/index';
import { newRow } from '../src/lib/triggers/new-row';

const { memoryStore, hookContext, names } = pgHarness;
const trigger = pgHarness.asPolling(newRow);
let db: PGlite;
let tableCounter = 0;

async function newTable({ columns }: { columns: string }): Promise<string> {
  tableCounter += 1;
  const name = `qa${tableCounter}`;
  await db.exec(`CREATE TABLE public.${name} (${columns})`);
  return name;
}

async function poll(target: Target & { column?: string }): Promise<string[]> {
  return names({ events: await trigger.run(hookContext(target)), column: target.column });
}

beforeAll(async () => {
  db = new PGlite();
  pgHarness.state.db = db;
});

afterAll(async () => {
  await db.close();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QA: Postgres New Row edge cases', () => {
  it('works on a non-public schema with names that need quoting (dot, space, capitals, quote)', async () => {
    await db.exec(`CREATE SCHEMA "Sales.EU"`);
    await db.exec(`CREATE TABLE "Sales.EU"."Order ""Items""" ("Order ID" text primary key, "Created At" timestamp(0) not null, "Status" text, name text)`);
    const target = { schema: 'Sales.EU', table: 'Order "Items"', orderBy: 'Created At' };
    await db.exec(`INSERT INTO "Sales.EU"."Order ""Items""" VALUES ('A-1', '2026-11-01 10:00:00', 'new', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, ...target }));
    expect(await poll({ store, ...target })).toEqual([]);
    await db.exec(`INSERT INTO "Sales.EU"."Order ""Items""" VALUES ('A-2', '2026-11-01 10:00:00', 'new', 'tie'), ('A-0', '2026-11-01 10:00:01', 'new', 'later')`);
    expect(await poll({ store, ...target })).toEqual(['later', 'tie']);
    await db.exec(`UPDATE "Sales.EU"."Order ""Items""" SET "Status" = 'done'`);
    expect(await poll({ store, ...target })).toEqual([]);
    const sample = await trigger.test(hookContext({ store, ...target }));
    expect(names({ events: sample })).toEqual(['later', 'tie', 'seed']);
  });

  it('dedupes by a composite primary key: edits do not re-fire, rows that differ only in one key column both fire', async () => {
    const table = await newTable({ columns: 'tenant text, n int, created_at date not null, status text, name text, primary key (tenant, n)' });
    await db.exec(`INSERT INTO ${table} VALUES ('acme', 1, '2026-11-01', 'new', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} VALUES ('acme', 2, '2026-11-01', 'new', 'acme-2'), ('beta', 1, '2026-11-01', 'new', 'beta-1')`);
    expect((await poll({ store, table })).sort()).toEqual(['acme-2', 'beta-1']);
    await db.exec(`UPDATE ${table} SET status = 'done', name = name || '-edited'`);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('keeps a timestamptz cursor exact across the DST fall-back hour in a non-UTC database session', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`SET TimeZone = 'America/Los_Angeles'`);
    try {
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:30:00-07', 'first-0130-pdt')`);
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, table }));
      expect(await poll({ store, table })).toEqual([]);
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:15:00-08', 'second-0115-pst'), ('2026-11-01 01:30:00-07', 'tie-0130-pdt')`);
      expect(await poll({ store, table })).toEqual(['second-0115-pst', 'tie-0130-pdt']);
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:30:00-08', 'second-0130-pst'), ('2026-11-01 01:59:59-07', 'older-0159-pdt')`);
      expect(await poll({ store, table })).toEqual(['second-0130-pst']);
      expect(await poll({ store, table })).toEqual([]);
    } finally {
      await db.exec(`SET TimeZone = 'UTC'`);
    }
  });

  it('keeps a naive timestamp cursor exact at a wall-clock time that is ambiguous for the worker zone', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp(6) not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:30:00.000001', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:30:00.000001', 'tie'), ('2026-11-01 01:30:00.000002', 'one-microsecond-later'), ('2026-11-01 01:30:00', 'one-microsecond-earlier')`);
    expect(await poll({ store, table })).toEqual(['one-microsecond-later', 'tie']);
    expect(await poll({ store, table })).toEqual([]);

    const asc = memoryStore();
    await trigger.onEnable(hookContext({ store: asc.store, table, direction: 'ASC' }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 01:29:59.999999', 'asc-newer')`);
    expect(await poll({ store: asc.store, table, direction: 'ASC' })).toEqual(['asc-newer']);
    expect(await poll({ store: asc.store, table, direction: 'ASC' })).toEqual([]);
  });

  it('round-trips order values of more column types', async () => {
    const cases: { type: string; seed: string; tie: string; newer: string; older: string }[] = [
      { type: 'double precision', seed: '0.30000000000000004', tie: '0.1::float8 + 0.2::float8', newer: '0.30000000000000010', older: '0.3' },
      { type: 'real', seed: '1.1', tie: '1.1', newer: '1.1000001', older: '1.0999999' },
      { type: 'numeric(30,9)', seed: '12345678901234567890.123456789', tie: '12345678901234567890.123456789', newer: '12345678901234567890.123456790', older: '12345678901234567890.123456788' },
      { type: 'smallint', seed: '7', tie: '7', newer: '8', older: '6' },
      { type: 'text', seed: `'O''Brien | 1'`, tie: `'O''Brien | 1'`, newer: `'O''Brien | 2'`, older: `'O''Brien | 0'` },
      { type: 'time', seed: `'10:00:00.5'`, tie: `'10:00:00.5'`, newer: `'10:00:00.500001'`, older: `'10:00:00'` },
      { type: 'interval', seed: `'1 day 02:00:00'`, tie: `'26 hours'`, newer: `'1 day 02:00:01'`, older: `'1 day'` },
      { type: 'money', seed: '10.50', tie: '10.50', newer: '10.51', older: '10.49' },
      { type: 'char(4)', seed: `'ab'`, tie: `'ab  '`, newer: `'ac'`, older: `'aa'` },
    ];
    for (const typeCase of cases) {
      const table = await newTable({ columns: `id serial primary key, created_at ${typeCase.type} not null, name text` });
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (${typeCase.seed}, 'seed')`);
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, table }));
      expect(await poll({ store, table }), typeCase.type).toEqual([]);
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (${typeCase.tie}, 'tie'), (${typeCase.newer}, 'newer'), (${typeCase.older}, 'older')`);
      expect(await poll({ store, table }), typeCase.type).toEqual(['newer', 'tie']);
      expect(await poll({ store, table }), typeCase.type).toEqual([]);
    }
  });

  it('re-baselines when only the order direction changes on republish', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'a'), ('2026-11-01T11:00:00Z', 'b'), ('2026-11-01T12:00:00Z', 'c')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await trigger.onDisable(hookContext({ store, table, direction: 'ASC', isRepublish: true }));
    await trigger.onEnable(hookContext({ store, table, direction: 'ASC', isRepublish: true }));
    expect(await poll({ store, table, direction: 'ASC' })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T09:00:00Z', 'asc-new')`);
    expect(await poll({ store, table, direction: 'ASC' })).toEqual(['asc-new']);
  });

  it('throws a SQL error instead of returning nothing and keeps the cursor for the next poll', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'a')`);
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    const before = data.get('new_row_cursor');
    await expect(trigger.run(hookContext({ store, table, orderBy: 'missing_column' }))).rejects.toThrow();
    expect(data.get('new_row_cursor')).toBe(before);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T11:00:00Z', 'b')`);
    expect(await poll({ store, table })).toEqual(['b']);
  });

  it('logs when a tie group outgrows the remembered keys', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const table = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT date '2026-11-01', 'old-' || n FROM generate_series(1, 1995) AS n`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    expect(warn).not.toHaveBeenCalled();
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT date '2026-11-01', 'tie-' || n FROM generate_series(1, 10) AS n`);
    expect((await poll({ store, table })).length).toBe(10);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('more than 2000 rows share the order value'));
    warn.mockClear();
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01', 'late-tie-past-cap')`);
    await poll({ store, table });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-02', 'next-day')`);
    expect(await poll({ store, table })).toEqual(['next-day']);
  });

  it('delivers every row already in the table when the remembered keys overflow inside a capped poll', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const table = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT date '2026-11-01', 'old-' || n FROM generate_series(1, 1900) AS n`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT date '2026-11-01', 'tie-' || n FROM generate_series(1, 600) AS n`);
    const fired: string[] = [];
    for (let run = 0; run < 4; run++) {
      fired.push(...(await poll({ store, table })));
    }
    expect(new Set(fired).size).toBe(fired.length);
    expect(fired.length).toBe(600);
  });
});
