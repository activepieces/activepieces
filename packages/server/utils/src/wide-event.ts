import { AsyncLocalStorage } from 'node:async_hooks'
import { audit as standaloneAudit, AuditInput, RequestLogger, withAuditMethods } from 'evlog'

const als = new AsyncLocalStorage<RequestLogger>()

function run<T>({ logger, fn }: { logger: RequestLogger, fn: () => T }): T {
    return als.run(logger, fn)
}

function set(fields: Record<string, unknown>): void {
    als.getStore()?.set(fields)
}

function error(err: unknown): void {
    const store = als.getStore()
    if (!store) return
    const wrapped = err instanceof Error ? err : new Error(String(err))
    store.error(wrapped)
}

async function timed<T>({ name, fn }: { name: string, fn: () => Promise<T> }): Promise<T> {
    const start = Date.now()
    try {
        const result = await fn()
        const ms = Math.round(Date.now() - start)
        als.getStore()?.set({ timings: { [`${name}Ms`]: ms } })
        return result
    }
    catch (err) {
        const ms = Math.round(Date.now() - start)
        als.getStore()?.set({ timings: { [`${name}Ms`]: ms } })
        throw err
    }
}

function audit(input: AuditInput): void {
    const store = als.getStore()
    if (store) {
        withAuditMethods(store).audit(input)
        return
    }
    standaloneAudit(input)
}

function current(): RequestLogger | undefined {
    return als.getStore()
}

export const wideEvent = {
    run,
    set,
    error,
    timed,
    audit,
    current,
}
