import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { pgHarness } from './helpers/pg-harness';

vi.mock('pg', async () => (await import('./helpers/pg-harness')).pgHarness.mockPg({}));

import '../src';
import { newRow as newRowTrigger } from '../src/lib/triggers/new-row';

const newRow = pgHarness.asPolling(newRowTrigger);

let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  pgHarness.state.db = db;
  await db.exec(`
    CREATE TABLE public.orders (
      id serial PRIMARY KEY,
      created_at timestamptz NOT NULL,
      status text NOT NULL
    );
    INSERT INTO public.orders (created_at, status) VALUES ('2026-10-20T10:00:00Z', 'new');
  `);
});
afterAll(async () => {
  await db.close();
});


describe('C0106 Postgres New Row: updating the last seen row re-fires it', () => {
  it('fires once per inserted row even when the flow writes back to that row', async () => {
    const { store } = pgHarness.memoryStore();
    const ctx = pgHarness.hookContext({ store, table: 'orders', host: 'db.example.test' });

    await newRow.onEnable(ctx);

    await db.query(`INSERT INTO public.orders (created_at, status) VALUES ('2026-10-20T11:00:00Z', 'new')`);
    const emittedIds: number[] = [];
    emittedIds.push(...(await newRow.run(ctx)).map((row) => Number(pgHarness.rowField({ row, key: 'id' }))));

    for (let i = 0; i < 3; i++) {
      await db.query(`UPDATE public.orders SET status = 'processed-${i}' WHERE id = 2`);
      emittedIds.push(...(await newRow.run(ctx)).map((row) => Number(pgHarness.rowField({ row, key: 'id' }))));
    }

    expect(emittedIds).toEqual([2]);
  });
});
