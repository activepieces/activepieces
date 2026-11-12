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

describe('QA round 3: Postgres New Row', () => {
  it('table without a primary key: deleting or editing rows below the cursor does not shift keys at the cursor', async () => {
    const table = await newTable({ columns: 'created_at date not null, status text, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-01', 'n', 'old'), ('2026-11-01', 'n', 'old'), ('2026-11-02', 'n', 'dup'), ('2026-11-02', 'n', 'dup')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`DELETE FROM ${table} WHERE ctid = (SELECT min(ctid) FROM ${table} WHERE name = 'old')`);
    await db.exec(`UPDATE ${table} SET status = 'e' WHERE name = 'old'`);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'dup')`);
    expect(await poll({ store, table })).toEqual(['dup']);
    await db.exec(`UPDATE ${table} SET status = status WHERE name = 'dup'`);
    expect(await poll({ store, table })).toEqual(['dup', 'dup', 'dup']);
    await db.exec(`VACUUM FULL ${table}`);
    expect((await poll({ store, table })).every((name) => name === 'dup')).toBe(true);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'other')`);
    expect(await poll({ store, table })).toEqual(['other']);
  });

  it('table without a primary key: identical rows split across the 500-row cap each fire once', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const table = await newTable({ columns: 'created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-01', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-02', 'same' FROM generate_series(1, 700)`);
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-02', 'other-' || n FROM generate_series(1, 300) n`);
    const runs = [await poll({ store, table }), await poll({ store, table }), await poll({ store, table })];
    expect(runs.map((run) => run.length)).toEqual([500, 500, 0]);
    const all = runs.flat();
    expect(all.filter((name) => name === 'same')).toHaveLength(700);
    expect(new Set(all.filter((name) => name !== 'same')).size).toBe(300);
  });

  it('naive timestamp in a database session west of UTC delivers rows written in UTC wall-clock time on the next poll', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp(3) not null, name text' });
    await db.exec(`SET TimeZone = 'America/Los_Angeles'`);
    try {
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ((now() AT TIME ZONE 'UTC') - interval '1 hour', 'past')`);
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, table }));
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() AT TIME ZONE 'UTC', 'utc-wall-clock')`);
      expect(await poll({ store, table })).toEqual(['utc-wall-clock']);
      expect(await poll({ store, table })).toEqual([]);
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ((now() AT TIME ZONE 'UTC') + interval '1 second', 'utc-later')`);
      expect(await poll({ store, table })).toEqual(['utc-later']);
      const sample = await trigger.test(hookContext({ store, table }));
      expect(names({ events: sample })).toContain('utc-wall-clock');
    } finally {
      await db.exec(`SET TimeZone = 'UTC'`);
    }
  });

  it('naive timestamp in a database session east of UTC delivers rows written in UTC wall-clock time', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamp not null, name text' });
    await db.exec(`SET TimeZone = 'Asia/Tokyo'`);
    try {
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES ((now() AT TIME ZONE 'UTC') - interval '1 hour', 'past')`);
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, table }));
      await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() AT TIME ZONE 'UTC', 'utc-now')`);
      expect(await poll({ store, table })).toEqual(['utc-now']);
    } finally {
      await db.exec(`SET TimeZone = 'UTC'`);
    }
  });

  it('carries % placeholders and quotes through names, keys, order values and the legacy checkpoint', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await db.exec(`CREATE SCHEMA "s%I'%s"`);
    const table = `t%L"'%s`;
    const relation = `"s%I'%s"."t%L""'%s"`;
    await db.exec(`CREATE TABLE ${relation} ("k%L'" text primary key, "c%s'%I" text not null, name text)`);
    await db.exec(`INSERT INTO ${relation} VALUES ('%L''a', '%s''1', 'seed'), ('%I''b', '%s''1', 'seed-tie')`);
    const target = { schema: `s%I'%s`, table, orderBy: `c%s'%I` };
    const legacy = memoryStore();
    await legacy.store.put('lastItem', `%s'1|0123456789abcdef0123456789abcdef`);
    expect((await poll({ store: legacy.store, ...target })).sort()).toEqual(['seed', 'seed-tie']);
    await db.exec(`INSERT INTO ${relation} VALUES ('%s''c', '%s''1', 'tie'), ('%%L', '%s''2', 'newer')`);
    expect(await poll({ store: legacy.store, ...target })).toEqual(['newer', 'tie']);
    expect(await poll({ store: legacy.store, ...target })).toEqual([]);
    await db.exec(`INSERT INTO ${relation} SELECT '%L''' || n, '%s''2', 'bulk' FROM generate_series(1, 2100) n`);
    const bulk: string[] = [];
    for (let run = 0; run < 6; run++) {
      bulk.push(...(await poll({ store: legacy.store, ...target })));
    }
    expect(bulk).toHaveLength(2100);
    await db.exec(`INSERT INTO ${relation} VALUES ('~%I''z', '%s''2', 'late-tie')`);
    expect(await poll({ store: legacy.store, ...target })).toEqual(['late-tie']);

    const plain = `p%L'%s`;
    await db.exec(`CREATE TABLE "s%I'%s"."p%L'%s" ("c%s'%I" text not null, name text)`);
    await db.exec(`INSERT INTO "s%I'%s"."p%L'%s" VALUES ('%s''1', 'seed'), ('%s''1', 'seed')`);
    const second = memoryStore();
    await trigger.onEnable(hookContext({ store: second.store, schema: `s%I'%s`, table: plain, orderBy: `c%s'%I` }));
    await db.exec(`INSERT INTO "s%I'%s"."p%L'%s" VALUES ('%s''1', 'seed'), ('%s''1', '%L''x')`);
    expect((await poll({ store: second.store, schema: `s%I'%s`, table: plain, orderBy: `c%s'%I` })).sort()).toEqual(["%L'x", 'seed']);
    const sample = await trigger.test(hookContext({ store: second.store, schema: `s%I'%s`, table: plain, orderBy: `c%s'%I` }));
    expect(sample).toHaveLength(4);
  });
  it('table without a primary key: rows added at a value already shared by more than 2000 rows still fire', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const table = await newTable({ columns: 'created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-01', 'old-' || n FROM generate_series(1, 2100) n`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    expect(warn).toHaveBeenCalled();
    await db.exec(`INSERT INTO ${table} SELECT date '2026-11-01', 'late-' || n FROM generate_series(1, 20) n`);
    expect((await poll({ store, table })).length).toBe(20);
  });
});
