import { AsyncLocalStorage } from 'node:async_hooks'
import { audit as standaloneAudit, AuditInput, log, RequestLogger, withAuditMethods } from 'evlog'

const als = new AsyncLocalStorage<RequestLogger>()
const emittedRequestIds = new WeakMap<RequestLogger, string | undefined>()
const wrappedLoggers = new WeakSet<RequestLogger>()

function run<T>({ logger, fn }: { logger: RequestLogger, fn: () => T }): T {
    if (!wrappedLoggers.has(logger)) {
        wrappedLoggers.add(logger)
        const originalEmit = logger.emit.bind(logger)
        logger.emit = (overrides) => {
            const requestId = logger.getContext()['requestId']
            emittedRequestIds.set(logger, typeof requestId === 'string' ? requestId : undefined)
            return originalEmit(overrides)
        }
    }
    return als.run(logger, fn)
}

function set(fields: Record<string, unknown>): void {
    current()?.set(fields)
}

function error(err: unknown): void {
    const store = als.getStore()
    if (!store) return
    const wrapped = err instanceof Error ? err : new Error(String(err))
    if (emittedRequestIds.has(store)) {
        log.error({ msg: wrapped.message, error: `${wrapped.message}\n${wrapped.stack ?? ''}`, ...correlation() })
        return
    }
    store.error(wrapped)
}

async function timed<T>({ name, fn }: { name: string, fn: () => Promise<T> }): Promise<T> {
    const start = Date.now()
    try {
        const result = await fn()
        const ms = Math.round(Date.now() - start)
        set({ timings: { [`${name}Ms`]: ms } })
        return result
    }
    catch (err) {
        const ms = Math.round(Date.now() - start)
        set({ timings: { [`${name}Ms`]: ms } })
        throw err
    }
}

function audit(input: AuditInput): void {
    const store = current()
    if (store) {
        withAuditMethods(store).audit(input)
        return
    }
    standaloneAudit(input)
}

function current(): RequestLogger | undefined {
    const store = als.getStore()
    if (!store || emittedRequestIds.has(store)) {
        return undefined
    }
    return store
}

function correlation(): Record<string, unknown> {
    const store = als.getStore()
    const requestId = store ? emittedRequestIds.get(store) : undefined
    return requestId ? { requestId } : {}
}

function capture(): RequestLogger | undefined {
    const store = current()
    if (!store) {
        return undefined
    }
    return {
        ...store,
        set: (fields) => {
            if (!emittedRequestIds.has(store)) {
                store.set(fields)
            }
        },
    }
}

export const wideEvent = {
    run,
    set,
    error,
    timed,
    audit,
    current,
    correlation,
    capture,
}
