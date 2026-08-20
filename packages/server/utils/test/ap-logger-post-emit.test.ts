import { createRequestLogger, initLogger } from 'evlog'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apLogger } from '../src/ap-logger'
import { wideEvent } from '../src/wide-event'

function evlogWarnings(warnSpy: ReturnType<typeof vi.spyOn>): string[] {
    return warnSpy.mock.calls
        .map((call) => String(call[0]))
        .filter((line) => line.includes('[evlog]'))
}

describe('post-emit logging', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>
    let infoSpy: ReturnType<typeof vi.spyOn>
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        initLogger({ env: { service: 'post-emit-test' }, pretty: false, redact: false })
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('apLogger.info after emit falls back to a standalone event with requestId instead of warning', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/files', requestId: 'req_test123' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                apLogger.create({}).info({ s3Key: 'project/p1/file' }, 'streaming file to s3')
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        const printed = infoSpy.mock.calls.map((call) => String(call[0]))
        const line = printed.find((entry) => entry.includes('streaming file to s3'))
        expect(line).toBeDefined()
        expect(JSON.parse(line ?? '{}')).toMatchObject({ msg: 'streaming file to s3', s3Key: 'project/p1/file', requestId: 'req_test123' })
    })

    it('apLogger.error after emit reaches stdout at error level instead of being dropped', () => {
        const logger = createRequestLogger({ method: 'POST', path: '/v1/authentication/sign-in', requestId: 'req_err1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                apLogger.create({ bindings: { route: '/v1/authentication/sign-in' } }).error({ error: new Error('boom') }, 'Unhandled exception')
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        const printed = errorSpy.mock.calls.map((call) => String(call[0]))
        const line = printed.find((entry) => entry.includes('Unhandled exception'))
        expect(line).toBeDefined()
        expect(JSON.parse(line ?? '{}')).toMatchObject({ msg: 'Unhandled exception', route: '/v1/authentication/sign-in', requestId: 'req_err1' })
    })

    it('wideEvent.set after emit is silently skipped', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/webhooks', requestId: 'req_set1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                wideEvent.set({ outcome: 'late' })
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
    })

    it('wideEvent.error after emit falls back to a standalone error event', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/runs', requestId: 'req_werr' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                wideEvent.error(new Error('late failure'))
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        const printed = errorSpy.mock.calls.map((call) => String(call[0]))
        const line = printed.find((entry) => entry.includes('late failure'))
        expect(line).toBeDefined()
        expect(JSON.parse(line ?? '{}')).toMatchObject({ msg: 'late failure', requestId: 'req_werr' })
    })

    it('pre-emit logging still lands on the wide event', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/flows', requestId: 'req_pre1' })
        wideEvent.run({
            logger,
            fn: () => {
                apLogger.create({}).info({ step: 'load' }, 'loading flow')
                wideEvent.set({ flowId: 'f1' })
            },
        })
        const context = logger.getContext()
        expect(context.flowId).toBe('f1')
        expect(context.requestLogs).toMatchObject([{ level: 'info', message: 'loading flow' }])
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(infoSpy.mock.calls.map((call) => String(call[0])).filter((entry) => entry.includes('loading flow'))).toEqual([])
    })

    it('captured logger keeps writing before emit and silently drops after emit', () => {
        const logger = createRequestLogger({ method: 'POST', path: '/v1/agents', requestId: 'req_cap1' })
        wideEvent.run({
            logger,
            fn: () => {
                const captured = wideEvent.capture()
                captured?.set({ ai: { model: 'gpt' } })
                logger.emit()
                captured?.set({ ai: { tokens: 5 } })
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(logger.getContext()['ai']).toEqual({ model: 'gpt' })
    })

    it('emit called through the logger reference held by the framework still seals for wideEvent callers', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/jobs', requestId: 'req_job1' })
        wideEvent.run({ logger, fn: () => undefined })
        logger.emit()
        wideEvent.run({
            logger,
            fn: () => {
                expect(wideEvent.current()).toBeUndefined()
                expect(wideEvent.correlation()).toEqual({ requestId: 'req_job1' })
            },
        })
    })
})
