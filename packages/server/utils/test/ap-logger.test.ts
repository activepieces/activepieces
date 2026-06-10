import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const spies = vi.hoisted(() => {
    const logInfoSpy = vi.fn()
    const logWarnSpy = vi.fn()
    const logErrorSpy = vi.fn()
    const logDebugSpy = vi.fn()
    const wideSetSpy = vi.fn()
    const wideInfoSpy = vi.fn()
    const wideWarnSpy = vi.fn()
    const wideErrorSpy = vi.fn()
    return { logInfoSpy, logWarnSpy, logErrorSpy, logDebugSpy, wideSetSpy, wideInfoSpy, wideWarnSpy, wideErrorSpy }
})

// Mutable flag for whether an ambient wide logger is present.
const ambientState = vi.hoisted(() => ({ active: false }))

vi.mock('evlog', async (importOriginal) => {
    const actual = await importOriginal<typeof import('evlog')>()
    return {
        ...actual,
        log: {
            info: spies.logInfoSpy,
            warn: spies.logWarnSpy,
            error: spies.logErrorSpy,
            debug: spies.logDebugSpy,
        },
    }
})

vi.mock('../src/wide-event', () => ({
    wideEvent: {
        current: () => ambientState.active
            ? {
                set: spies.wideSetSpy,
                info: spies.wideInfoSpy,
                warn: spies.wideWarnSpy,
                error: spies.wideErrorSpy,
            }
            : undefined,
        set: spies.wideSetSpy,
    },
}))

import { apLogger } from '../src/ap-logger'

describe('apLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ambientState.active = false
    })

    afterEach(() => {
        ambientState.active = false
    })

    describe('without ambient wide event', () => {
        it('info(string) calls log.info with msg field', () => {
            const logger = apLogger.create({})
            logger.info('hello world')
            expect(spies.logInfoSpy).toHaveBeenCalledOnce()
            expect(spies.logInfoSpy.mock.calls[0][0]).toMatchObject({ msg: 'hello world' })
        })

        it('info(obj, string) uses string as msg and spreads obj', () => {
            const logger = apLogger.create({})
            logger.info({ userId: '42' }, 'user found')
            expect(spies.logInfoSpy).toHaveBeenCalledOnce()
            const arg = spies.logInfoSpy.mock.calls[0][0]
            expect(arg).toMatchObject({ msg: 'user found', userId: '42' })
        })

        it('info(obj) without second arg has no msg', () => {
            const logger = apLogger.create({})
            logger.info({ event: 'login' })
            expect(spies.logInfoSpy).toHaveBeenCalledOnce()
            const arg = spies.logInfoSpy.mock.calls[0][0]
            expect(arg).toMatchObject({ event: 'login' })
            expect(arg.msg).toBeUndefined()
        })

        it('error(Error) logs to log.error with err details', () => {
            const logger = apLogger.create({})
            const err = new Error('boom')
            logger.error(err)
            expect(spies.logErrorSpy).toHaveBeenCalledOnce()
            const arg = spies.logErrorSpy.mock.calls[0][0]
            expect(arg.err).toContain('boom')
        })

        it('error(obj with .err Error) extracts the error', () => {
            const logger = apLogger.create({})
            const err = new Error('nested')
            logger.error({ err, requestId: 'r1' }, 'context msg')
            expect(spies.logErrorSpy).toHaveBeenCalledOnce()
            const arg = spies.logErrorSpy.mock.calls[0][0]
            expect(arg.err).toContain('nested')
            expect(arg.requestId).toBe('r1')
        })

        it('debug() calls log.debug, not wide event', () => {
            ambientState.active = true
            const logger = apLogger.create({})
            logger.debug('debug msg')
            expect(spies.logDebugSpy).toHaveBeenCalledOnce()
            expect(spies.wideInfoSpy).not.toHaveBeenCalled()
        })

        it('fatal() maps to error path', () => {
            const logger = apLogger.create({})
            logger.fatal('fatal msg')
            expect(spies.logErrorSpy).toHaveBeenCalledOnce()
        })

        it('trace() calls log.debug', () => {
            const logger = apLogger.create({})
            logger.trace('trace msg')
            expect(spies.logDebugSpy).toHaveBeenCalledOnce()
        })

        it('silent() does not throw', () => {
            const logger = apLogger.create({})
            expect(() => logger.silent()).not.toThrow()
        })

        it('does not throw on unexpected input', () => {
            const logger = apLogger.create({})
            expect(() => logger.info(null as unknown as string)).not.toThrow()
        })
    })

    describe('with ambient wide event', () => {
        beforeEach(() => {
            ambientState.active = true
        })

        it('info(string) calls wide.info with message', () => {
            const logger = apLogger.create({})
            logger.info('ambient info')
            expect(spies.wideInfoSpy).toHaveBeenCalledOnce()
            expect(spies.wideInfoSpy.mock.calls[0][0]).toBe('ambient info')
            expect(spies.logInfoSpy).not.toHaveBeenCalled()
        })

        it('warn(string) calls wide.warn', () => {
            const logger = apLogger.create({})
            logger.warn('some warning')
            expect(spies.wideWarnSpy).toHaveBeenCalledOnce()
            expect(spies.wideWarnSpy.mock.calls[0][0]).toBe('some warning')
        })

        it('error(Error) calls wide.error', () => {
            const logger = apLogger.create({})
            const err = new Error('wide error')
            logger.error(err)
            expect(spies.wideErrorSpy).toHaveBeenCalledOnce()
            expect(spies.wideErrorSpy.mock.calls[0][0]).toBe(err)
        })

        it('info() merges bindings into fields', () => {
            const logger = apLogger.create({ bindings: { service: 'api' } })
            logger.info({ userId: '1' }, 'request')
            expect(spies.wideInfoSpy).toHaveBeenCalledOnce()
            const ctx = spies.wideInfoSpy.mock.calls[0][1]
            expect(ctx).toMatchObject({ service: 'api', userId: '1' })
        })
    })

    describe('child()', () => {
        it('child() merges bindings and calls wideEvent.set', () => {
            const logger = apLogger.create({ bindings: { parent: true } })
            const child = logger.child({ requestId: 'r99' })
            expect(spies.wideSetSpy).toHaveBeenCalledWith({ requestId: 'r99' })
            // Child should carry merged bindings (no ambient)
            ambientState.active = false
            child.info('child msg')
            const arg = spies.logInfoSpy.mock.calls[0][0]
            expect(arg).toMatchObject({ parent: true, requestId: 'r99' })
        })
    })

    describe('level property', () => {
        it('level returns the current configured level', () => {
            apLogger.setCurrentLevel('warn')
            const logger = apLogger.create({})
            expect(logger.level).toBe('warn')
            apLogger.setCurrentLevel('info') // restore
        })
    })
})
