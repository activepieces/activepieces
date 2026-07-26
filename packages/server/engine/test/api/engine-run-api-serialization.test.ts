import { CallbackSerializationError, ExecutionError, ExecutionErrorType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { engineRunApi } from '../../src/lib/api/engine-run-api'

const circularStep = (): Record<string, unknown> => {
    const step: Record<string, unknown> = { name: 'step_3' }
    step.self = step
    return step
}

describe('engine run callbacks with a non-serializable body', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('fails as a USER error naming the cause, without calling fetch or burning retries', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch')
        const startedAt = Date.now()

        const thrown = await engineRunApi.updateRunProgress({
            apiUrl: 'http://127.0.0.1:1/',
            engineToken: 'token',
            request: { step: circularStep() } as never,
        }).catch((error: unknown) => error)

        expect(thrown).toBeInstanceOf(CallbackSerializationError)
        expect((thrown as ExecutionError).type).toBe(ExecutionErrorType.USER)
        expect((thrown as ExecutionError).message).toContain('run-progress')
        expect((thrown as ExecutionError).message).toContain('circular')
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(Date.now() - startedAt).toBeLessThan(1000)
    })

    it('classifies an unserializable run-log upload the same way', async () => {
        const thrown = await engineRunApi.uploadRunLog({
            apiUrl: 'http://127.0.0.1:1/',
            engineToken: 'token',
            request: { runId: 'run', output: { rows: 10n } } as never,
        }).catch((error: unknown) => error)

        expect(thrown).toBeInstanceOf(CallbackSerializationError)
        expect((thrown as ExecutionError).type).toBe(ExecutionErrorType.USER)
        expect((thrown as ExecutionError).message).toContain('BigInt')
    })

    it('keeps a raw network rejection unclassified so the trailing guard still retries it', async () => {
        vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'))
        vi.useFakeTimers()

        const pending = engineRunApi.updateRunProgress({
            apiUrl: 'http://127.0.0.1:1/',
            engineToken: 'token',
            request: { step: { name: 'step_3' } } as never,
        }).catch((error: unknown) => error)
        await vi.runAllTimersAsync()
        const thrown = await pending
        vi.useRealTimers()

        expect(thrown).toBeInstanceOf(TypeError)
        expect(thrown).not.toBeInstanceOf(CallbackSerializationError)
    })

    it('keeps a non-ok response an ENGINE error so genuine outages still retry', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue(new Response('nope', { status: 400, statusText: 'Bad Request' }))

        const thrown = await engineRunApi.updateRunProgress({
            apiUrl: 'http://127.0.0.1:1/',
            engineToken: 'token',
            request: { step: { name: 'step_3' } } as never,
        }).catch((error: unknown) => error)

        expect(thrown).toBeInstanceOf(ExecutionError)
        expect((thrown as ExecutionError).name).toBe('EngineRunCallbackError')
        expect((thrown as ExecutionError).type).toBe(ExecutionErrorType.ENGINE)
    })
})
