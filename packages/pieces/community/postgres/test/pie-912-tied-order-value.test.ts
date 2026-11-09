import net from 'net'
import { PGlite } from '@electric-sql/pglite'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { newRow as NewRowTrigger } from '../src/lib/triggers/new-row'
import { pgHarness } from './helpers/pg-harness'

let db: PGlite
let server: net.Server
let port = 0

async function startPostgres() {
    db = await PGlite.create()
    let chain: Promise<unknown> = Promise.resolve()
    server = net.createServer((sock) => {
        let buf = Buffer.alloc(0)
        let started = false
        sock.on('data', (chunk) => {
            buf = Buffer.concat([buf, chunk])
            const msgs: Buffer[] = []
            for (;;) {
                if (!started) {
                    if (buf.length < 4) break
                    const len = buf.readInt32BE(0)
                    if (buf.length < len) break
                    msgs.push(buf.subarray(0, len)); buf = buf.subarray(len); started = true
                } else {
                    if (buf.length < 5) break
                    const len = buf.readInt32BE(1) + 1
                    if (buf.length < len) break
                    msgs.push(buf.subarray(0, len)); buf = buf.subarray(len)
                }
            }
            if (msgs.length === 0) return
            const payload = Buffer.concat(msgs)
            chain = chain.then(async () => {
                const out = await db.execProtocolRaw(new Uint8Array(payload))
                if (out && out.length > 0 && !sock.destroyed) sock.write(Buffer.from(out))
            }).catch(() => sock.destroy())
        })
        sock.on('error', () => undefined)
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
    const address = server.address()
    port = typeof address === 'object' && address !== null ? address.port : 0
}

function makeCtx({ table, orderBy }: { table: string; orderBy: string }) {
    const { store, data } = pgHarness.memoryStore()
    return { ctx: pgHarness.hookContext({ store, table, orderBy, host: '127.0.0.1', port }), data }
}

let newRow: ReturnType<typeof pgHarness.asPolling<typeof NewRowTrigger>>
beforeAll(async () => {
    await startPostgres()
    await import('../src/index')
    newRow = pgHarness.asPolling((await import('../src/lib/triggers/new-row')).newRow)
})
afterAll(async () => { server?.close(); await db?.close() })

describe('Postgres New Row with rows that share the order value of the stored row', () => {
    it('second-precision timestamp: a row inserted in the same second as the stored row is delivered', async () => {
        await db.exec(`CREATE TABLE public.events (id serial primary key, created_at timestamp(0) not null, name text)`)
        await db.exec(`INSERT INTO public.events (created_at, name) VALUES ('2026-10-21 09:59:00', 'old'), ('2026-10-21 10:00:00', 'e1')`)
        const { ctx, data } = makeCtx({ table: 'events', orderBy: 'created_at' })
        await newRow.onEnable(ctx)
        const stored = String(pgHarness.storeValue({ data, key: 'lastItem' }))

        await db.exec(`INSERT INTO public.events (created_at, name) VALUES ('2026-10-21 10:00:00', 'e2')`)
        const order = (await db.query<{ name: string }>(`SELECT name FROM public.events WHERE created_at >= '2026-10-21 10:00:00' ORDER BY created_at DESC`)).rows.map((r) => r.name)
        const poll1 = pgHarness.names({ events: await newRow.run(ctx), column: 'name' })
        await db.exec(`INSERT INTO public.events (created_at, name) VALUES ('2026-10-21 10:00:05', 'e3')`)
        const poll2 = pgHarness.names({ events: await newRow.run(ctx), column: 'name' })
        const poll3 = pgHarness.names({ events: await newRow.run(ctx), column: 'name' })
        console.log('C0341 timestamp(0): stored =', stored.split('|')[0], 'postgres tie order =', JSON.stringify(order), 'poll1 =', JSON.stringify(poll1), 'poll2 =', JSON.stringify(poll2), 'poll3 =', JSON.stringify(poll3))
        expect([...poll1, ...poll2, ...poll3].sort()).toEqual(['e2', 'e3'])
    })

    it('DATE column: invoices issued on the same day as the stored row are delivered', async () => {
        await db.exec(`CREATE TABLE public.invoices (id serial primary key, issued_on date not null, number text)`)
        await db.exec(`INSERT INTO public.invoices (issued_on, number) VALUES ('2026-10-20', 'INV-0099'), ('2026-10-21', 'INV-0100')`)
        const { ctx } = makeCtx({ table: 'invoices', orderBy: 'issued_on' })
        await newRow.onEnable(ctx)

        await db.exec(`INSERT INTO public.invoices (issued_on, number) VALUES ('2026-10-21', 'INV-0101'), ('2026-10-21', 'INV-0102')`)
        const poll1 = pgHarness.names({ events: await newRow.run(ctx), column: 'number' })
        await db.exec(`INSERT INTO public.invoices (issued_on, number) VALUES ('2026-10-21', 'INV-0103')`)
        const poll2 = pgHarness.names({ events: await newRow.run(ctx), column: 'number' })
        await db.exec(`INSERT INTO public.invoices (issued_on, number) VALUES ('2026-10-22', 'INV-0104')`)
        const poll3 = pgHarness.names({ events: await newRow.run(ctx), column: 'number' })
        const poll4 = pgHarness.names({ events: await newRow.run(ctx), column: 'number' })
        console.log('C0341 date: poll1 =', JSON.stringify(poll1), 'poll2 =', JSON.stringify(poll2), 'poll3 =', JSON.stringify(poll3), 'poll4 =', JSON.stringify(poll4))
        expect([...poll1, ...poll2, ...poll3, ...poll4].sort()).toEqual(['INV-0101', 'INV-0102', 'INV-0103', 'INV-0104'])
    })
})
