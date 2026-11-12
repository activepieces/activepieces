import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.hoisted(() => {
    process.env.TZ = 'America/New_York'
})

vi.mock('pg', async (importOriginal) => (await import('./helpers/pg-harness')).pgHarness.mockPg({ actual: await importOriginal() }))

import { PGlite } from '@electric-sql/pglite'
import { pgHarness } from './helpers/pg-harness'
import '../src/index'
import { newRow as newRowTrigger } from '../src/lib/triggers/new-row'

const newRow = pgHarness.asPolling(newRowTrigger)

let db: PGlite

describe('C0721 postgres new-row timestamp without time zone on non-UTC worker', () => {
    beforeAll(async () => {
        db = new PGlite()
        pgHarness.state.db = db
        await db.exec(`CREATE TABLE orders (id serial PRIMARY KEY, name text, created_at timestamp without time zone)`)
    })

    it('delivers a row inserted one hour after the last processed row', async () => {
        expect(new Date(2026, 0, 15, 10).getTimezoneOffset()).toBe(300)

        const { store, data } = pgHarness.memoryStore()
        const ctx = pgHarness.hookContext({ store, table: 'orders' })
        await db.exec(`INSERT INTO orders (name, created_at) VALUES ('A', '2026-01-15 10:00:00')`)
        await newRow.onEnable(ctx)

        await db.exec(`INSERT INTO orders (name, created_at) VALUES ('B', '2026-01-15 11:00:00')`)
        const poll1 = pgHarness.names({ events: await newRow.run(ctx) })

        await db.exec(`INSERT INTO orders (name, created_at) VALUES ('C', '2026-01-15 17:00:00')`)
        const poll2 = pgHarness.names({ events: await newRow.run(ctx) })

        const delivered = [...poll1, ...poll2]
        console.log('C0721 delivered', JSON.stringify({ poll1, poll2, cursor: pgHarness.storeValue({ data, key: 'lastItem' }) }))
        expect(delivered).toEqual(['B', 'C'])
    })
})
