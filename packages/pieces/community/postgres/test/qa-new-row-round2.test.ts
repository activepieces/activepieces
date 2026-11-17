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

describe('QA round 2: Postgres New Row', () => {
  it('quotes primary-key values of every kind in the seen list and in the overflow cursor', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const keys = ["a'b", 'c\\d', "e''\\'f", 'ünï😀', 'x"y', "'); DROP TABLE qa_r2_victim; --", 'tab\tnl\n'];
    await db.exec(`CREATE TABLE qa_r2_victim (x int)`);
    const table = await newTable({ columns: 'k text, b bytea, u uuid, created_at date not null, name text, primary key (k, b, u)' });
    await db.exec(`INSERT INTO ${table} VALUES ('seed', '\\x00', '00000000-0000-0000-0000-000000000000', '2026-11-01', 'seed')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    for (const [index, key] of keys.entries()) {
      await db.query(`INSERT INTO ${table} VALUES ($1, $2, $3, '2026-11-01', $4)`, [key, new Uint8Array([0x5c, 0x27, index]), `00000000-0000-0000-0000-00000000000${index}`, `k${index}`]);
    }
    expect((await poll({ store, table })).sort()).toEqual(keys.map((_key, index) => `k${index}`));
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`INSERT INTO ${table} SELECT E'z\\\\''' || n, '\\x5c27', gen_random_uuid(), '2026-11-01', 'bulk-' || n FROM generate_series(1, 2100) n`);
    const bulk: string[] = [];
    for (let run = 0; run < 6; run++) {
      bulk.push(...(await poll({ store, table })));
    }
    expect(bulk).toHaveLength(2100);
    expect(new Set(bulk).size).toBe(2100);
    for (const [index, key] of keys.entries()) {
      await db.query(`INSERT INTO ${table} VALUES ($1, $2, $3, '2026-11-01', $4)`, [`zz${key}`, new Uint8Array([0xff, index]), `ffffffff-0000-0000-0000-00000000000${index}`, `late${index}`]);
    }
    expect((await poll({ store, table })).sort()).toEqual(keys.map((_key, index) => `late${index}`));
    expect(await poll({ store, table })).toEqual([]);
    expect((await db.query(`SELECT to_regclass('qa_r2_victim') AS r`)).rows).toEqual([{ r: 'qa_r2_victim' }]);
  });

  it('holds a future timestamptz row until its time and delivers it once', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() - interval '1 hour', 'past')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() + interval '2 seconds', 'soon'), (now() - interval '1 minute', 'recent')`);
    expect(await poll({ store, table })).toEqual(['recent']);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(await poll({ store, table })).toEqual(['soon']);
    expect(await poll({ store, table })).toEqual([]);
  });

  it('does not lose rows written after a timestamptz row dated two hours ahead', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at timestamptz not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() - interval '1 hour', 'past')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now() + interval '2 hours', 'two-hours-ahead')`);
    const fired = await poll({ store, table });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (now(), 'written-now')`);
    fired.push(...(await poll({ store, table })));
    expect(fired).toContain('written-now');
  });

  it('does not lose rows dated today after a row dated tomorrow in a date column', async () => {
    const table = await newTable({ columns: 'id serial primary key, created_at date not null, name text' });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (current_date - 1, 'yesterday')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (current_date + 1, 'dated-ahead')`);
    const fired = await poll({ store, table });
    await db.exec(`INSERT INTO ${table} (created_at, name) VALUES (current_date, 'dated-today')`);
    fired.push(...(await poll({ store, table })));
    expect(fired).toContain('dated-today');
  });

  it('table without a primary key: edits below the newest value do not fire, edits at it fire again', async () => {
    const table = await newTable({ columns: 'created_at date not null, status text, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-01', 'n', 'old'), ('2026-11-02', 'n', 'newest')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`UPDATE ${table} SET status = 'e' WHERE name = 'old'`);
    expect(await poll({ store, table })).toEqual([]);
    await db.exec(`UPDATE ${table} SET status = 'e' WHERE name = 'newest'`);
    expect(await poll({ store, table })).toEqual(['newest']);
  });

  it('table without a primary key: a tied row that reuses a vacuumed slot still fires', async () => {
    const table = await newTable({ columns: 'created_at date not null, status text, name text' });
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'seed-a'), ('2026-11-02', 'n', 'seed-b')`);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, table }));
    await db.exec(`DELETE FROM ${table} WHERE name = 'seed-b'`);
    await db.exec(`VACUUM ${table}`);
    await db.exec(`INSERT INTO ${table} VALUES ('2026-11-02', 'n', 'tie-after-vacuum')`);
    expect(await poll({ store, table })).toEqual(['tie-after-vacuum']);
  });
});
