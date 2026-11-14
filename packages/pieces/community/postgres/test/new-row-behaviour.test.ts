import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'crypto';
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
  const name = `t${tableCounter}`;
  await db.exec(`CREATE TABLE public.${name} (${columns})`);
  return name;
}

async function legacyId({ table, name, column }: { table: string; name: string; column?: string }): Promise<string> {
  const result = await db.query<Record<string, unknown>>(`SELECT * FROM ${table} WHERE name = '${name}'`, [], { parsers: pgHarness.state.parsers ?? {} });
  const row = result.rows[0];
  const value = row[column ?? 'created_at'];
  const orderValue = value instanceof Date ? value.toISOString() : String(value);
  return `${orderValue}|${createHash('md5').update(JSON.stringify(row)).digest('hex')}`;
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

describe('Postgres New Row behaviour', () => {
  it('fires once per new row across polls, republish and never for rows that existed at enable', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:00:00', 'old-1'), ('2026-11-01 10:01:00', 'old-2')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:02:00', 'new-1')`);
    expect(await poll({ store, table })).toEqual(['new-1']);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:03:00', 'between')`);
    await trigger.onDisable(hookContext({ store, table, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, table, isRepublish: true }));
    expect(await poll({ store, table })).toEqual(['between']);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:04:00', 'new-2'), ('2026-11-01 10:05:00', 'new-3')`);
    expect(await poll({ store, table })).toEqual(['new-3', 'new-2']);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('turning the flow off and on again re-baselines instead of replaying', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'a')`);
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await trigger.onDisable(hookContext({ store, table }));
    expect(data.has('new_row_cursor')).toBe(true);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T11:00:00Z', 'while-off')`);
    await trigger.onEnable(hookContext({ store, table }));
    expect(await poll({ store, table })).toEqual([]);
  });

  it('keeps the cursor when onDisable runs on a republish', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'a')`);
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    const cursor = data.get('new_row_cursor');
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T11:00:00Z', 'before-republish')`);
    await trigger.onDisable(hookContext({ store, table }));
    expect(data.get('new_row_cursor')).toEqual(cursor);
    await trigger.onEnable(hookContext({ store, table, isRepublish: true }));
    expect(await poll({ store, table })).toEqual(['before-republish']);
  });

  it('does not re-fire a row when it is updated, with or without a primary key', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, status text, payload jsonb, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, status, payload, name) VALUES ('2026-11-01T10:00:00Z', 'new', '{}', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, status, payload, name) VALUES ('2026-11-01T11:00:00Z', 'new', '{}', 'row')`);
    expect(await poll({ store, table })).toEqual(['row']);
    for (let attempt = 0; attempt < 3; attempt++) {
      await db.exec(`UPDATE ${table} SET status = 'processed-${attempt}', payload = '{"attempt": ${attempt}}' WHERE name = 'row'`);
      expect(await poll({ store, table })).toEqual([]);
    }
    await db.exec(`UPDATE ${table} SET status = 'touched' WHERE name = 'seed'`);
    expect(await poll({ store, table })).toEqual([]);

    const plain = await newTable({ columns: 'created_at timestamptz not null, status text, name text' });
    await db.exec(`INSERT INTO ${plain} (created_at, status, name) VALUES ('2026-11-01T10:00:00Z', 'new', 'p-old')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: plain }));
    await db.exec(`INSERT INTO ${plain} (created_at, status, name) VALUES ('2026-11-01T11:00:00Z', 'new', 'p-row'), ('2026-11-01T12:00:00Z', 'new', 'p-newest')`);
    expect(await poll({ store: second.store, table: plain })).toEqual(['p-newest', 'p-row']);
    await db.exec(`UPDATE ${plain} SET status = 'processed' WHERE name IN ('p-old', 'p-row')`);
    expect(await poll({ store: second.store, table: plain })).toEqual([]);
  });

  it('fires every row that shares the order value: second-precision timestamp, date and numeric with a different scale', async () => {
    const stamps = await newTable({ columns: 'id serial primary key, created_at timestamp(0) not null, name text' });
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('2026-11-01 10:00:00', 'seed')`);
    const first = memoryStore();
    await trigger.onEnable(hookContext({ store: first.store, table: stamps }));
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('2026-11-01 10:00:00', 'tie-a')`);
    expect(await poll({ store: first.store, table: stamps })).toEqual(['tie-a']);
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('2026-11-01 10:00:00', 'tie-b')`);
    expect(await poll({ store: first.store, table: stamps })).toEqual(['tie-b']);
    expect(await poll({ store: first.store, table: stamps })).toEqual([]);

    const dates = await newTable({ columns: 'id serial primary key, issued_on date not null, name text' });
    await db.exec(`INSERT INTO ${dates} (issued_on, name) VALUES ('2026-11-01', 'seed')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: dates, orderBy: 'issued_on' }));
    await db.exec(`INSERT INTO ${dates} (issued_on, name) VALUES ('2026-11-01', 'd-1'), ('2026-11-01', 'd-2')`);
    expect((await poll({ store: second.store, table: dates, orderBy: 'issued_on' })).sort()).toEqual(['d-1', 'd-2']);
    await db.exec(`INSERT INTO ${dates} (issued_on, name) VALUES ('2026-11-02', 'd-3'), ('2026-11-01', 'd-late')`);
    expect((await poll({ store: second.store, table: dates, orderBy: 'issued_on' })).sort()).toEqual(['d-3', 'd-late']);
    expect(await poll({ store: second.store, table: dates, orderBy: 'issued_on' })).toEqual([]);

    const amounts = await newTable({ columns: 'id serial primary key, amount numeric not null, name text' });
    await db.exec(`INSERT INTO ${amounts} (amount, name) VALUES (1.0, 'seed')`);
    const third = memoryStore();
    await trigger.onEnable(hookContext({ store: third.store, table: amounts, orderBy: 'amount' }));
    await db.exec(`INSERT INTO ${amounts} (amount, name) VALUES (1.00, 'same-value')`);
    expect(await poll({ store: third.store, table: amounts, orderBy: 'amount' })).toEqual(['same-value']);
    expect(await poll({ store: third.store, table: amounts, orderBy: 'amount' })).toEqual([]);
  });

  it('handles timestamptz with microseconds in both directions, bigint, uuid and text order columns', async () => {
    const micro = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${micro} (created_at, name) VALUES ('2026-11-01T10:00:00.123456Z', 'seed')`);
    const desc = memoryStore();
    await trigger.onEnable(hookContext({ store: desc.store, table: micro }));
    await db.exec(`INSERT INTO ${micro} (created_at, name) VALUES ('2026-11-01T10:00:00.123457Z', 'one-microsecond-later')`);
    expect(await poll({ store: desc.store, table: micro })).toEqual(['one-microsecond-later']);
    expect(await poll({ store: desc.store, table: micro })).toEqual([]);

    const asc = memoryStore();
    await trigger.onEnable(hookContext({ store: asc.store, table: micro, direction: 'ASC' }));
    expect(await poll({ store: asc.store, table: micro, direction: 'ASC' })).toEqual([]);
    await db.exec(`INSERT INTO ${micro} (created_at, name) VALUES ('2026-11-01T09:00:00.000001Z', 'smaller')`);
    expect(await poll({ store: asc.store, table: micro, direction: 'ASC' })).toEqual(['smaller']);
    expect(await poll({ store: asc.store, table: micro, direction: 'ASC' })).toEqual([]);
    expect(await poll({ store: asc.store, table: micro, direction: 'ASC' })).toEqual([]);

    const big = await newTable({ columns: 'seq bigint primary key, name text' });
    await db.exec(`INSERT INTO ${big} (seq, name) VALUES (9007199254740993, 'seed')`);
    const bigStore = memoryStore();
    await trigger.onEnable(hookContext({ store: bigStore.store, table: big, orderBy: 'seq' }));
    await db.exec(`INSERT INTO ${big} (seq, name) VALUES (9007199254740994, 'next')`);
    expect(await poll({ store: bigStore.store, table: big, orderBy: 'seq' })).toEqual(['next']);
    expect(await poll({ store: bigStore.store, table: big, orderBy: 'seq' })).toEqual([]);

    const uuids = await newTable({ columns: 'ref uuid primary key, name text' });
    await db.exec(`INSERT INTO ${uuids} (ref, name) VALUES ('00000000-0000-0000-0000-000000000001', 'seed')`);
    const uuidStore = memoryStore();
    await trigger.onEnable(hookContext({ store: uuidStore.store, table: uuids, orderBy: 'ref' }));
    await db.exec(`INSERT INTO ${uuids} (ref, name) VALUES ('00000000-0000-0000-0000-000000000002', 'next')`);
    expect(await poll({ store: uuidStore.store, table: uuids, orderBy: 'ref' })).toEqual(['next']);
    expect(await poll({ store: uuidStore.store, table: uuids, orderBy: 'ref' })).toEqual([]);

    const texts = await newTable({ columns: 'id serial primary key, code text not null, name text' });
    await db.exec(`INSERT INTO ${texts} (code, name) VALUES ('A-001', 'seed')`);
    const textStore = memoryStore();
    await trigger.onEnable(hookContext({ store: textStore.store, table: texts, orderBy: 'code' }));
    await db.exec(`INSERT INTO ${texts} (code, name) VALUES ('A-002', 'next'), ('A-001', 'same-code')`);
    expect((await poll({ store: textStore.store, table: texts, orderBy: 'code' })).sort()).toEqual(['next', 'same-code']);
    expect(await poll({ store: textStore.store, table: texts, orderBy: 'code' })).toEqual([]);
  });

  it('skips rows with an empty order value without failing, in polls and in the sample', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'dated'), (NULL, 'empty-at-enable')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (NULL, 'empty-later'), ('2026-11-01T11:00:00Z', 'dated-later')`);
    expect(await poll({ store, table })).toEqual(['dated-later']);
    expect(await poll({ store, table })).toEqual([]);
    const sample = names({ events: await trigger.test(hookContext({ store, table })) });
    expect(sample).toEqual(['dated-later', 'dated']);

    const empty = await newTable({ columns: 'id serial primary key, created_at timestamptz, name text' });
    await db.exec(`INSERT INTO ${empty} (created_at, name) VALUES (NULL, 'only-empty')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: empty }));
    expect(await poll({ store: second.store, table: empty })).toEqual([]);
    await db.exec(`INSERT INTO ${empty} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'first-dated')`);
    expect(await poll({ store: second.store, table: empty })).toEqual(['first-dated']);
  });

  it('keeps working when the last delivered row is deleted', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp(0) not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:00:00', 'a')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:01:00', 'b'), ('2026-11-01 10:01:00', 'b-tie')`);
    expect((await poll({ store, table })).sort()).toEqual(['b', 'b-tie']);
    await db.exec(`DELETE FROM ${table} WHERE name = 'b'`);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 10:02:00', 'c')`);
    expect(await poll({ store, table })).toEqual(['c']);
  });

  it('delivers a burst bigger than the per-poll cap over several polls, oldest first, none twice and none lost', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01 00:00:00', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT timestamp '2026-11-01 00:00:00' + n * interval '1 second', 'burst-' || n FROM generate_series(1, 1200) AS n`);
    const first = await poll({ store, table });
    const second = await poll({ store, table });
    const third = await poll({ store, table });
    expect([first.length, second.length, third.length]).toEqual([500, 500, 200]);
    expect(first[first.length - 1]).toBe('burst-1');
    expect(await poll({ store, table })).toEqual([]);
    const all = [...first, ...second, ...third];
    expect(new Set(all).size).toBe(1200);

    const ties = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${ties} (created_at, name) VALUES ('2026-11-01', 'seed')`);
    const tieStore = memoryStore();
    await trigger.onEnable(hookContext({ store: tieStore.store, table: ties }));
    await db.exec(`INSERT INTO ${ties} (created_at, name) SELECT date '2026-11-02', 'tie-' || n FROM generate_series(1, 1200) AS n`);
    const tieRuns = [await poll({ store: tieStore.store, table: ties }), await poll({ store: tieStore.store, table: ties }), await poll({ store: tieStore.store, table: ties })];
    expect(tieRuns.map((run) => run.length)).toEqual([500, 500, 200]);
    expect(new Set(tieRuns.flat()).size).toBe(1200);
    expect(await poll({ store: tieStore.store, table: ties })).toEqual([]);
  });

  it('drains a tie group larger than the remembered keys without repeating rows', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT date '2026-11-02', 'tie-' || n FROM generate_series(1, 2600) AS n`);
    const fired: string[] = [];
    for (let run = 0; run < 7; run++) {
      fired.push(...(await poll({ store, table })));
    }
    expect(fired).toHaveLength(2600);
    expect(new Set(fired).size).toBe(2600);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-02', 'late-tie-1'), ('2026-11-02', 'late-tie-2')`);
    expect(await poll({ store, table })).toEqual(['late-tie-2', 'late-tie-1']);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-03', 'next-day')`);
    expect(await poll({ store, table })).toEqual(['next-day']);

    const capped = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${capped} (created_at, name) SELECT date '2026-11-01', 'old-' || n FROM generate_series(1, 1900) AS n`);
    const cappedStore = memoryStore();
    await trigger.onEnable(hookContext({ store: cappedStore.store, table: capped }));
    await db.exec(`INSERT INTO ${capped} (created_at, name) SELECT date '2026-11-01', 'tie-' || n FROM generate_series(1, 600) AS n`);
    const cappedRuns = [await poll({ store: cappedStore.store, table: capped }), await poll({ store: cappedStore.store, table: capped }), await poll({ store: cappedStore.store, table: capped })];
    expect(cappedRuns.map((run) => run.length)).toEqual([500, 100, 0]);
    expect(new Set(cappedRuns.flat()).size).toBe(600);

    const crowded = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${crowded} (created_at, name) SELECT date '2026-11-01', 'old-' || n FROM generate_series(1, 2100) AS n`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: crowded }));
    expect(await poll({ store: second.store, table: crowded })).toEqual([]);
    await db.exec(`INSERT INTO ${crowded} (created_at, name) VALUES ('2026-11-01', 'late-tie')`);
    expect(await poll({ store: second.store, table: crowded })).toEqual(['late-tie']);
    await db.exec(`INSERT INTO ${crowded} (created_at, name) VALUES ('2026-11-02', 'next-day')`);
    expect(await poll({ store: second.store, table: crowded })).toEqual(['next-day']);
  });

  it('never lets an infinite, NaN or future order value stall the cursor', async () => {
    const stamps = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'seed'), ('infinity', 'infinite-at-enable')`);
    const first = memoryStore();
    await trigger.onEnable(hookContext({ store: first.store, table: stamps }));
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('infinity', 'infinite'), (now() + interval '1 hour', 'future'), ('2026-11-01T11:00:00Z', 'normal')`);
    expect(await poll({ store: first.store, table: stamps })).toEqual(['normal']);
    await db.exec(`INSERT INTO ${stamps} (created_at, name) VALUES ('2026-11-01T12:00:00Z', 'normal-2')`);
    expect(await poll({ store: first.store, table: stamps })).toEqual(['normal-2']);
    await db.exec(`UPDATE ${stamps} SET created_at = now() - interval '1 minute' WHERE name = 'future'`);
    expect(await poll({ store: first.store, table: stamps })).toEqual(['future']);
    const sample = names({ events: await trigger.test(hookContext({ store: first.store, table: stamps })) });
    expect(sample).not.toContain('infinite');

    const naive = await newTable({ columns: 'id serial primary key, created_at timestamp not null, day date not null, name text' });
    await db.exec(`INSERT INTO ${naive} (created_at, day, name) VALUES ('2026-11-01 10:00:00', '2026-11-01', 'seed')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: naive }));
    const third = memoryStore();
    await trigger.onEnable(hookContext({ store: third.store, table: naive, orderBy: 'day' }));
    await db.exec(`INSERT INTO ${naive} (created_at, day, name) VALUES ('2026-11-01 10:30:00', '2099-01-01', 'far-future'), ('-infinity', '-infinity', 'minus-infinite'), ('2026-11-01 11:00:00', '2026-11-02', 'normal')`);
    expect(await poll({ store: second.store, table: naive })).toEqual(['normal', 'far-future']);
    expect(await poll({ store: third.store, table: naive, orderBy: 'day' })).toEqual(['normal']);
    await db.exec(`INSERT INTO ${naive} (created_at, day, name) VALUES ('2026-11-01 12:00:00', '2026-11-03', 'normal-2')`);
    expect(await poll({ store: second.store, table: naive })).toEqual(['normal-2']);
    expect(await poll({ store: third.store, table: naive, orderBy: 'day' })).toEqual(['normal-2']);

    const amounts = await newTable({ columns: 'id serial primary key, amount double precision not null, name text' });
    await db.exec(`INSERT INTO ${amounts} (amount, name) VALUES (1, 'seed'), ('NaN', 'nan-at-enable')`);
    const fourth = memoryStore();
    await trigger.onEnable(hookContext({ store: fourth.store, table: amounts, orderBy: 'amount' }));
    await db.exec(`INSERT INTO ${amounts} (amount, name) VALUES ('Infinity', 'infinite'), ('NaN', 'nan'), (2, 'two')`);
    expect(await poll({ store: fourth.store, table: amounts, orderBy: 'amount' })).toEqual(['two']);
    await db.exec(`INSERT INTO ${amounts} (amount, name) VALUES (3, 'three')`);
    expect(await poll({ store: fourth.store, table: amounts, orderBy: 'amount' })).toEqual(['three']);
  });

  it('without a primary key: identical duplicate rows each fire, edits below the newest value never re-fire', async () => {
    const table = await newTable({ columns: 'created_at timestamp(0) not null, status text, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, status, name) VALUES ('2026-11-01 10:00:00', 'new', 'dup')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, status, name) VALUES ('2026-11-01 10:00:00', 'new', 'dup'), ('2026-11-01 10:00:00', 'new', 'dup')`);
    expect(await poll({ store, table })).toEqual(['dup', 'dup']);
    await db.exec(`INSERT INTO ${table} (created_at, status, name) VALUES ('2026-11-01 10:00:00', 'new', 'dup')`);
    expect(await poll({ store, table })).toEqual(['dup']);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, status, name) VALUES ('2026-11-01 11:00:00', 'new', 'newest')`);
    expect(await poll({ store, table })).toEqual(['newest']);
    await db.exec(`UPDATE ${table} SET status = 'processed' WHERE name = 'dup'`);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('without a primary key: deleting delivered identical rows never hides the pending ones', async () => {
    const table = await newTable({ columns: 'created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-01', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-02', 'same' FROM generate_series(1, 700)`);
    expect(await poll({ store, table })).toHaveLength(500);
    await db.exec(`DELETE FROM ${table} WHERE ctid IN (SELECT ctid FROM ${table} WHERE name = 'same' ORDER BY ctid LIMIT 500)`);
    const rest = await poll({ store, table });
    expect(rest).toHaveLength(200);
    expect(rest.every((name) => name === 'same')).toBe(true);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('without a primary key: VACUUM FULL can repeat rows at the newest value but never loses a new one', async () => {
    const table = await newTable({ columns: 'created_at date not null, status text, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'seed-a'), ('2026-11-02', 'n', 'seed-b'), ('2026-11-02', 'n', 'twin'), ('2026-11-02', 'n', 'twin')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`DELETE FROM ${table} WHERE name = 'seed-a'`);
    await db.exec(`VACUUM FULL ${table}`);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'new-tie')`);
    const fired = await poll({ store, table });
    expect(fired).toContain('new-tie');
    expect(fired.filter((name) => name !== 'new-tie').every((name) => ['seed-b', 'twin'].includes(name))).toBe(true);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`DELETE FROM ${table} WHERE ctid = (SELECT max(ctid) FROM ${table} WHERE name = 'twin')`);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'twin')`);
    expect(await poll({ store, table })).toEqual(['twin']);
  });

  it('without a primary key on a partitioned table: a tie group past the remembered keys drains across partitions', async () => {
    tableCounter += 1;
    const table = `parted${tableCounter}`;
    await db.exec(`CREATE TABLE public.${table} (created_at date not null, part int not null, name text) PARTITION BY LIST (part)`);
    await db.exec(`CREATE TABLE public.${table}_a PARTITION OF public.${table} FOR VALUES IN (1)`);
    await db.exec(`CREATE TABLE public.${table}_b PARTITION OF public.${table} FOR VALUES IN (2)`);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-01', 1, 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-02', 1 + n % 2, 'row-' || n FROM generate_series(1, 2600) AS n`);
    const fired: string[] = [];
    for (let run = 0; run < 7; run++) {
      fired.push(...(await poll({ store, table })));
    }
    expect(new Set(fired).size).toBe(2600);
    expect(fired).toHaveLength(2600);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 2, 'late-tie')`);
    expect(await poll({ store, table })).toEqual(['late-tie']);
  });

  it('returns user columns whose names look like the trigger helpers', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, __ap_note text, __ap_tie_0 text, __ap_order text, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, __ap_note, __ap_tie_0, __ap_order, name) VALUES ('2026-11-01T10:00:00Z', 'n0', 't0', 'o0', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, __ap_note, __ap_tie_0, __ap_order, name) VALUES ('2026-11-01T11:00:00Z', 'n1', 't1', 'o1', 'new')`);
    const [row] = await trigger.run(hookContext({ store, table }));
    expect(pgHarness.keysOf(row)).toEqual(['id', 'created_at', '__ap_note', '__ap_tie_0', '__ap_order', 'name']);
    expect([pgHarness.rowField({ row, key: '__ap_note' }), pgHarness.rowField({ row, key: '__ap_tie_0' }), pgHarness.rowField({ row, key: '__ap_order' })]).toEqual(['n1', 't1', 'o1']);

    const plain = await newTable({ columns: 'created_at date not null, __ap_tie_0 text, name text' });
    await db.exec(`INSERT INTO ${plain} VALUES ('2026-11-01', 'x', 'seed')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: plain }));
    await db.exec(`INSERT INTO ${plain} VALUES ('2026-11-01', 'y', 'tie')`);
    const [tie] = await trigger.run(hookContext({ store: second.store, table: plain }));
    expect(pgHarness.keysOf(tie)).toEqual(['created_at', '__ap_tie_0', 'name']);
  });

  it('pages array primary keys past the remembered keys, from enable and mid-poll', async () => {
    const ints = await newTable({ columns: 'k int[] primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${ints} SELECT ARRAY[n, n + 1], date '2026-11-01', 'base-' || n FROM generate_series(1, 2100) AS n`);
    const first = memoryStore();
    await trigger.onEnable(hookContext({ store: first.store, table: ints }));
    await db.exec(`INSERT INTO ${ints} VALUES (ARRAY[999999, 1], '2026-11-01', 'late-tie')`);
    expect(await poll({ store: first.store, table: ints })).toEqual(['late-tie']);
    await db.exec(`INSERT INTO ${ints} SELECT ARRAY[n, -n], date '2026-11-02', 'mid-' || n FROM generate_series(1, 2600) AS n`);
    const fired: string[] = [];
    for (let run = 0; run < 7; run++) {
      fired.push(...(await poll({ store: first.store, table: ints })));
    }
    expect(fired).toHaveLength(2600);
    expect(new Set(fired).size).toBe(2600);

    const texts = await newTable({ columns: 'k text[] primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${texts} VALUES (ARRAY['seed'], '2026-11-01', 'seed')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, table: texts }));
    await db.exec(`INSERT INTO ${texts} SELECT ARRAY['a,b', 'q"x''y', '{' || n || '}', n::text], date '2026-11-02', 'text-' || n FROM generate_series(1, 2300) AS n`);
    const textFired: string[] = [];
    for (let run = 0; run < 6; run++) {
      textFired.push(...(await poll({ store: second.store, table: texts })));
    }
    expect(textFired).toHaveLength(2300);
    expect(new Set(textFired).size).toBe(2300);
    await db.exec(`INSERT INTO ${texts} VALUES (ARRAY['zz', 'late'], '2026-11-02', 'text-late')`);
    expect(await poll({ store: second.store, table: texts })).toEqual(['text-late']);
  });

  it('keeps order values and keys that contain percent signs and placeholders intact', async () => {
    const table = await newTable({ columns: 'code text primary key, created_at text not null, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('50%L', '2026-%I-01 %s', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} VALUES ('%I%L%s', '2026-%I-01 %s', 'tie'), ('x', '2026-%I-02', 'newer')`);
    expect(await poll({ store, table })).toEqual(['newer', 'tie']);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('continues from an old checkpoint inside one millisecond: the delivered row stays quiet, the rest of that millisecond fires', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00.122Z', 'older'), ('2026-11-01T10:00:00.123001Z', 'delivered')`);
    const legacy = await legacyId({ table, name: 'delivered' });
    expect(legacy.startsWith('2026-11-01T10:00:00.123Z|')).toBe(true);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00.123999Z', 'same-millisecond')`);
    const { store } = memoryStore();
    await store.put('lastItem', legacy);
    await trigger.onEnable(hookContext({ store, table, isRepublish: true }));
    expect(await poll({ store, table })).toEqual(['same-millisecond']);
    expect(await poll({ store, table })).toEqual([]);

    const unknown = memoryStore();
    await unknown.store.put('lastItem', '2026-11-01T10:00:00.123Z|0123456789abcdef0123456789abcdef');
    expect((await poll({ store: unknown.store, table })).sort()).toEqual(['delivered', 'same-millisecond']);
  });

  it('continues from an old checkpoint on columns without a time zone, whatever the worker time zone', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp(6) not null, day date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, day, name) VALUES ('2026-11-01 10:00:00.123001', '2026-11-01', 'delivered')`);
    const stamp = await legacyId({ table, name: 'delivered' });
    const day = await legacyId({ table, name: 'delivered', column: 'day' });
    await db.exec(`INSERT INTO ${table} (created_at, day, name) VALUES ('2026-11-01 10:00:00.123999', '2026-11-02', 'pending'), ('2026-11-01 12:00:00', '2026-11-03', 'later')`);
    const byStamp = memoryStore();
    await byStamp.store.put('lastItem', stamp);
    expect(await poll({ store: byStamp.store, table })).toEqual(['later', 'pending']);
    const byDay = memoryStore();
    await byDay.store.put('lastItem', day);
    expect(await poll({ store: byDay.store, table, orderBy: 'day' })).toEqual(['later', 'pending']);
  });

  it('keeps the stored checkpoint small with long text primary keys in a tie group larger than the remembered keys', async () => {
    const table = await newTable({ columns: 'code text primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} (code, created_at, name) VALUES (repeat('s', 300), '2026-11-01', 'seed')`);
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (code, created_at, name) SELECT repeat('k', 295) || lpad(n::text, 5, '0'), '2026-11-02', 'long-' || n FROM generate_series(1, 2300) AS n`);
    const fired: string[] = [];
    const sizes: number[] = [];
    for (let run = 0; run < 6; run++) {
      fired.push(...(await poll({ store, table })));
      sizes.push((data.get('new_row_cursor') ?? '').length * 2);
    }
    expect(fired).toHaveLength(2300);
    expect(new Set(fired).size).toBe(2300);
    expect(Math.max(...sizes)).toBeLessThan(512 * 1024);
    await db.exec(`INSERT INTO ${table} (code, created_at, name) VALUES (repeat('z', 300), '2026-11-02', 'late-tie')`);
    expect(await poll({ store, table })).toEqual(['late-tie']);
  });

  it('re-baselines when the table or order column changes on republish', async () => {
    const first = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, seq int not null, name text' });
    const other = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${first} (created_at, seq, name) VALUES ('2026-11-01T10:00:00Z', 5, 'f-1')`);
    await db.exec(`INSERT INTO ${other} (created_at, name) VALUES ('2026-11-01T09:00:00Z', 'o-1'), ('2026-11-01T12:00:00Z', 'o-2')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table: first }));
    await trigger.onEnable(hookContext({ store, table: other, isRepublish: true }));
    expect(await poll({ store, table: other })).toEqual([]);
    await db.exec(`INSERT INTO ${other} (created_at, name) VALUES ('2026-11-01T13:00:00Z', 'o-3')`);
    expect(await poll({ store, table: other })).toEqual(['o-3']);
    await trigger.onEnable(hookContext({ store, table: first, orderBy: 'seq', isRepublish: true }));
    expect(await poll({ store, table: first, orderBy: 'seq' })).toEqual([]);
    expect(await poll({ store, table: first })).toEqual([]);
    await db.exec(`INSERT INTO ${first} (created_at, seq, name) VALUES ('2026-11-01T11:00:00Z', 6, 'f-2')`);
    expect(await poll({ store, table: first })).toEqual(['f-2']);
  });

  it('continues from a checkpoint stored by the previous version', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T10:00:00Z', 'delivered'), ('2026-11-01T10:00:00Z', 'delivered-tie'), ('2026-11-01T11:00:00Z', 'after-checkpoint')`);
    const legacy = await legacyId({ table, name: 'delivered' });
    const viaRepublish = memoryStore();
    await viaRepublish.store.put('lastItem', legacy);
    await trigger.onEnable(hookContext({ store: viaRepublish.store, table, isRepublish: true }));
    expect(viaRepublish.data.has('lastItem')).toBe(false);
    expect(await poll({ store: viaRepublish.store, table })).toEqual(['after-checkpoint']);
    expect(await poll({ store: viaRepublish.store, table })).toEqual([]);

    const viaRun = memoryStore();
    await viaRun.store.put('lastItem', legacy);
    expect(await poll({ store: viaRun.store, table })).toEqual(['after-checkpoint']);
    expect(viaRun.data.has('lastItem')).toBe(false);
    expect(await poll({ store: viaRun.store, table })).toEqual([]);

    const brokenLegacy = memoryStore();
    await brokenLegacy.store.put('lastItem', 'null|2392c4f8f80f288442364be47ee962ce');
    await trigger.onEnable(hookContext({ store: brokenLegacy.store, table, isRepublish: true }));
    expect(await poll({ store: brokenLegacy.store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-01T12:00:00Z', 'new')`);
    expect(await poll({ store: brokenLegacy.store, table })).toEqual(['new']);

    const garbageLegacy = memoryStore();
    await garbageLegacy.store.put('lastItem', '[object Object]|0123');
    expect(await poll({ store: garbageLegacy.store, table })).toEqual([]);
  });

  it('round-trips the checkpoint under a non-ISO DateStyle', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp not null, day date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, day, name) VALUES ('2026-02-03 10:00:00.5', '2026-02-03', 'seed')`);
    await db.exec(`SET DateStyle = 'SQL, DMY'`);
    try {
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, table }));
      const day = memoryStore();
      await trigger.onEnable(hookContext({ store: day.store, table, orderBy: 'day' }));
      await db.exec(`INSERT INTO ${table} (created_at, day, name) VALUES ('2026-02-03 10:00:00.5', '2026-02-03', 'tie'), ('2026-03-02 09:00:00', '2026-03-02', 'later')`);
      expect((await poll({ store, table })).sort()).toEqual(['later', 'tie']);
      expect(await poll({ store, table })).toEqual([]);
      expect((await poll({ store: day.store, table, orderBy: 'day' })).sort()).toEqual(['later', 'tie']);
      expect(await poll({ store: day.store, table, orderBy: 'day' })).toEqual([]);
    } finally {
      await db.exec(`SET DateStyle = 'ISO, MDY'`);
    }
  });

  it('test() returns the newest five rows with the same keys as a run() row', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) SELECT timestamptz '2026-11-01T00:00:00Z' + n * interval '1 minute', 'row-' || n FROM generate_series(1, 8) AS n`);
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (NULL, 'empty')`);
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store, table }));
    expect(names({ events: sample })).toEqual(['row-8', 'row-7', 'row-6', 'row-5', 'row-4']);
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ('2026-11-02T00:00:00Z', 'real')`);
    const [real] = await trigger.run(hookContext({ store, table }));
    expect(pgHarness.keysOf(real)).toEqual(pgHarness.keysOf(sample[0]));
    expect(pgHarness.keysOf(real)).toEqual(['id', 'created_at', 'name']);
  });

  it('sends every trigger query without bind parameters', async () => {
    expect(pgHarness.state.queries.length).toBeGreaterThan(0);
    expect(pgHarness.state.queries.filter((sql) => /\$\d/.test(sql))).toEqual([]);
  });
});
