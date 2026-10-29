import { createRequestLogger, initLogger } from 'evlog'
import { evlog as evlogFastify, useLogger } from 'evlog/fastify'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apLogger } from '../src/ap-logger'
import { wideEvent } from '../src/wide-event'

function printed(spy: ReturnType<typeof vi.spyOn>): string[] {
    return spy.mock.calls.map((call) => String(call[0]))
}

function evlogWarnings(warnSpy: ReturnType<typeof vi.spyOn>): string[] {
    return printed(warnSpy).filter((line) => line.includes('[evlog]'))
}

function findLine({ spy, text }: { spy: ReturnType<typeof vi.spyOn>, text: string }): Record<string, unknown> | undefined {
    const line = printed(spy).find((entry) => entry.includes(text))
    return line ? JSON.parse(line) : undefined
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

    it('apLogger.info after emit is dropped without a warning or a standalone event', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/files', requestId: 'req_info1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                apLogger.create({}).info({ s3Key: 'project/p1/file' }, 'streaming file to s3')
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(printed(infoSpy).filter((line) => line.includes('streaming file to s3'))).toEqual([])
    })

    it('apLogger.warn after emit becomes a standalone event marked postEmit', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/files', requestId: 'req_warn1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                apLogger.create({}).warn({ s3Key: 'project/p1/file' }, 'objectExists check failed')
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(findLine({ spy: warnSpy, text: 'objectExists check failed' })).toMatchObject({ s3Key: 'project/p1/file', postEmit: true, requestId: 'req_warn1' })
    })

    it('apLogger.error after emit becomes a standalone event marked postEmit', () => {
        const logger = createRequestLogger({ method: 'POST', path: '/v1/files', requestId: 'req_err1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                apLogger.create({ bindings: { route: '/v1/files' } }).error({ error: new Error('boom') }, 'failed to stream file to s3')
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(findLine({ spy: errorSpy, text: 'failed to stream file to s3' })).toMatchObject({ route: '/v1/files', postEmit: true, requestId: 'req_err1' })
    })

    it('apLogger.info outside any wide event still logs standalone without the postEmit marker', () => {
        apLogger.create({}).info({ step: 'boot' }, 'server started')
        const line = findLine({ spy: infoSpy, text: 'server started' })
        expect(line).toMatchObject({ step: 'boot' })
        expect(line).not.toHaveProperty('postEmit')
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

    it('wideEvent.error after emit becomes a standalone event and keeps a non-Error payload readable', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/runs', requestId: 'req_werr' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                wideEvent.error({ code: 'TOOL_FAILED' })
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(findLine({ spy: errorSpy, text: 'TOOL_FAILED' })).toMatchObject({ msg: '{"code":"TOOL_FAILED"}', postEmit: true, requestId: 'req_werr' })
    })

    it('wideEvent.audit after emit is kept as a standalone audit event', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/connections', requestId: 'req_aud1' })
        wideEvent.run({
            logger,
            fn: () => {
                logger.emit()
                wideEvent.audit({ action: 'connection.listed', actor: { type: 'user', id: 'u1' } })
            },
        })
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(findLine({ spy: infoSpy, text: 'connection.listed' })).toMatchObject({ audit: { action: 'connection.listed' } })
    })

    it('pre-emit logging still lands on the wide event', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/flows', requestId: 'req_pre1' })
        wideEvent.run({
            logger,
            fn: () => {
                apLogger.create({}).info({ step: 'load' }, 'loading flow')
                wideEvent.set({ flowId: 'f1' })
                expect(wideEvent.sealed()).toBe(false)
                expect(wideEvent.postEmitContext()).toEqual({})
            },
        })
        const context = logger.getContext()
        expect(context.flowId).toBe('f1')
        expect(context.requestLogs).toMatchObject([{ level: 'info', message: 'loading flow' }])
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(printed(infoSpy).filter((entry) => entry.includes('loading flow'))).toEqual([])
    })

    it('emit called through the logger reference held by the framework still seals for wideEvent callers', () => {
        const logger = createRequestLogger({ method: 'GET', path: '/v1/jobs', requestId: 'req_job1' })
        wideEvent.run({ logger, fn: () => undefined })
        logger.emit()
        wideEvent.run({
            logger,
            fn: () => {
                expect(wideEvent.current()).toBeUndefined()
                expect(wideEvent.sealed()).toBe(true)
                expect(wideEvent.postEmitContext()).toEqual({ postEmit: true, requestId: 'req_job1' })
            },
        })
    })

    it('work that outlives a request served by the evlog fastify plugin logs without a warning', async () => {
        const app = Fastify()
        await app.register(evlogFastify)
        app.addHook('onRequest', (_request, _reply, done) => {
            wideEvent.run({ logger: useLogger(), fn: () => done() })
        })
        let finishLateWork: () => void = () => undefined
        const lateWorkDone = new Promise<void>((resolve) => {
            finishLateWork = resolve
        })
        app.get('/late', async () => {
            const log = apLogger.create({})
            setTimeout(() => {
                log.info('late info line')
                log.error({ error: new Error('late failure') }, 'late error line')
                wideEvent.set({ late: true })
                finishLateWork()
            }, 20)
            return 'ok'
        })

        const response = await app.inject({ method: 'GET', url: '/late', headers: { 'x-request-id': 'req_fastify1' } })
        await lateWorkDone
        await app.close()

        expect(response.statusCode).toBe(200)
        expect(evlogWarnings(warnSpy)).toEqual([])
        expect(printed(infoSpy).filter((line) => line.includes('late info line'))).toEqual([])
        expect(findLine({ spy: errorSpy, text: 'late error line' })).toMatchObject({ postEmit: true, requestId: 'req_fastify1' })
    })
})
