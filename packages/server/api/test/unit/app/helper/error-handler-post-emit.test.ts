import { apLogger, evlogFastify, useWideEventLogger, wideEvent } from '@activepieces/server-utils'
import Fastify, { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enrichWideEventWithError, errorHandler } from '../../../../src/app/helper/error-handler'
import { exceptionHandler } from '../../../../src/app/helper/exception-handler'

async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify()
    app.setErrorHandler(errorHandler)
    app.addHook('onError', (_request, _reply, error, done) => {
        enrichWideEventWithError(error)
        done()
    })
    await app.register(evlogFastify, { exclude: ['/excluded'] })
    app.addHook('onRequest', (request, _reply, done) => {
        try {
            const wide = useWideEventLogger()
            Object.assign(request, { log: apLogger.create({ bindings: {} }) })
            wideEvent.run({ logger: wide, fn: () => done() })
        }
        catch {
            done()
        }
    })
    app.get('/boom', async () => {
        throw new Error('database is down')
    })
    app.get('/excluded', async () => {
        throw new Error('excluded route failed')
    })
    return app
}

function postEmitWarnings(warnSpy: ReturnType<typeof vi.spyOn>): string[] {
    return warnSpy.mock.calls
        .map((call) => String(call[0]))
        .filter((line) => line.includes('called after the wide event was emitted'))
}

describe('errorHandler after the evlog plugin sealed the wide event', () => {
    let app: FastifyInstance
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'log').mockImplementation(() => undefined)
        app = await buildApp()
    })

    afterEach(async () => {
        await app.close()
        vi.restoreAllMocks()
    })

    it('reports a 500 to Sentry only, because the wide event already carries the error', async () => {
        const handleSpy = vi.spyOn(exceptionHandler, 'handle')
        const captureSpy = vi.spyOn(exceptionHandler, 'captureException')

        const response = await app.inject({ method: 'GET', url: '/boom' })

        expect(response.statusCode).toBe(500)
        expect(handleSpy).not.toHaveBeenCalled()
        expect(captureSpy).toHaveBeenCalledTimes(1)
        expect(postEmitWarnings(warnSpy)).toEqual([])
    })

    it('still logs a 500 on a route without a wide event', async () => {
        const handleSpy = vi.spyOn(exceptionHandler, 'handle')
        const captureSpy = vi.spyOn(exceptionHandler, 'captureException')

        const response = await app.inject({ method: 'GET', url: '/excluded' })

        expect(response.statusCode).toBe(500)
        expect(handleSpy).toHaveBeenCalledTimes(1)
        expect(captureSpy).not.toHaveBeenCalled()
    })
})
