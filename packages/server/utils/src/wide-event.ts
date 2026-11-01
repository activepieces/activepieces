import { toError } from '@activepieces/core-utils'
import { AsyncLocalStorage } from 'node:async_hooks'
import { audit as standaloneAudit, AuditInput, log, RequestLogger, withAuditMethods } from 'evlog'

const als = new AsyncLocalStorage<RequestLogger>()
const sealedLoggers = new WeakMap<RequestLogger, Record<string, unknown>>()
const trackedLoggers = new WeakSet<RequestLogger>()

function run<T>({ logger, fn }: { logger: RequestLogger, fn: () => T }): T {
    trackSeal(logger)
    return als.run(logger, fn)
}

function set(fields: Record<string, unknown>): void {
    current()?.set(fields)
}

function error(err: unknown): void {
    const store = als.getStore()
    if (!store) return
    const wrapped = toError(err)
    if (sealedLoggers.has(store)) {
        log.error({ msg: wrapped.message, error: `${wrapped.message}\n${wrapped.stack ?? ''}`, ...postEmitContext() })
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
    if (!store || sealedLoggers.has(store)) {
        return undefined
    }
    return store
}

function sealed(): boolean {
    const store = als.getStore()
    return store !== undefined && sealedLoggers.has(store)
}

function postEmitContext(): Record<string, unknown> {
    const store = als.getStore()
    const context = store ? sealedLoggers.get(store) : undefined
    return context ? { postEmit: true, ...context } : {}
}

function trackSeal(logger: RequestLogger): void {
    if (trackedLoggers.has(logger)) {
        return
    }
    trackedLoggers.add(logger)
    const originalEmit = logger.emit.bind(logger)
    logger.emit = (overrides) => {
        const requestId = logger.getContext()['requestId']
        sealedLoggers.set(logger, typeof requestId === 'string' ? { requestId } : {})
        return originalEmit(overrides)
    }
}

export const wideEvent = {
    run,
    set,
    error,
    timed,
    audit,
    current,
    sealed,
    postEmitContext,
}
