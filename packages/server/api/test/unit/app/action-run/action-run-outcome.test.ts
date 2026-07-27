import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus, FlowRunStatus } from '@activepieces/shared'
import { deriveActionRunOutcome } from '../../../../src/app/action-run/action-run-outcome'
import { WORKER_DID_NOT_RESPOND_MESSAGE } from '../../../../src/app/workers/user-interaction-watcher'

function ok(overrides: { success: boolean, output?: unknown, message?: string, logs?: string }) {
    return {
        result: {
            data: {
                status: EngineResponseStatus.OK,
                response: { success: overrides.success, input: {}, output: overrides.output, message: overrides.message },
                ...(overrides.logs !== undefined ? { logs: overrides.logs } : {}),
            },
            error: null,
        },
    }
}

describe('deriveActionRunOutcome', () => {
    describe('status table', () => {
        it('OK + success maps to SUCCEEDED', () => {
            expect(deriveActionRunOutcome(ok({ success: true })).status).toBe(FlowRunStatus.SUCCEEDED)
        })
        it('OK + failure maps to FAILED', () => {
            expect(deriveActionRunOutcome(ok({ success: false })).status).toBe(FlowRunStatus.FAILED)
        })
        it('TIMEOUT maps to TIMEOUT', () => {
            const outcome = deriveActionRunOutcome({
                result: { data: { status: EngineResponseStatus.TIMEOUT, response: { success: false, input: {}, output: null } }, error: null },
            })
            expect(outcome.status).toBe(FlowRunStatus.TIMEOUT)
        })
        it('any other engine status maps to INTERNAL_ERROR', () => {
            const outcome = deriveActionRunOutcome({
                result: { data: { status: EngineResponseStatus.USER_FAILURE, response: { success: false, input: {}, output: null } }, error: null },
            })
            expect(outcome.status).toBe(FlowRunStatus.INTERNAL_ERROR)
        })
        it('error channel maps to INTERNAL_ERROR', () => {
            const outcome = deriveActionRunOutcome({ result: { data: null, error: new Error('boom') } })
            expect(outcome.status).toBe(FlowRunStatus.INTERNAL_ERROR)
        })
        it('watcher timeout maps to TIMEOUT, not INTERNAL_ERROR', () => {
            const error = new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: WORKER_DID_NOT_RESPOND_MESSAGE },
            })
            expect(deriveActionRunOutcome({ result: { data: null, error } }).status).toBe(FlowRunStatus.TIMEOUT)
        })
        it('other ENGINE_OPERATION_FAILURE errors stay INTERNAL_ERROR', () => {
            const error = new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: 'sandbox failed to boot' },
            })
            expect(deriveActionRunOutcome({ result: { data: null, error } }).status).toBe(FlowRunStatus.INTERNAL_ERROR)
        })
    })

    describe('errorMessage precedence', () => {
        it('is null on success', () => {
            expect(deriveActionRunOutcome(ok({ success: true })).errorMessage).toBeNull()
        })
        it('prefers response.message when present', () => {
            expect(deriveActionRunOutcome(ok({ success: false, message: 'bad field' })).errorMessage).toBe('bad field')
        })
        it('falls back to engine error field', () => {
            const outcome = deriveActionRunOutcome({
                result: { data: { status: EngineResponseStatus.INTERNAL_ERROR, response: { success: false, input: {}, output: null }, error: 'engine exploded' }, error: null },
            })
            expect(outcome.errorMessage).toBe('engine exploded')
        })
        it('is null on failure with neither message nor error', () => {
            expect(deriveActionRunOutcome(ok({ success: false })).errorMessage).toBeNull()
        })
        it('error channel uses Error.message', () => {
            expect(deriveActionRunOutcome({ result: { data: null, error: new Error('boom') } }).errorMessage).toBe('boom')
        })
        it('error channel stringifies non-Error', () => {
            expect(deriveActionRunOutcome({ result: { data: null, error: 'plain string' } }).errorMessage).toBe('plain string')
        })
    })

    describe('output', () => {
        it('is carried on success', () => {
            expect(deriveActionRunOutcome(ok({ success: true, output: { note: 'ab' } })).output).toEqual({ note: 'ab' })
        })
        it('is null on failure', () => {
            expect(deriveActionRunOutcome(ok({ success: false, output: { data: 1 } })).output).toBeNull()
        })
        it('is null on the error channel', () => {
            expect(deriveActionRunOutcome({ result: { data: null, error: new Error('x') } }).output).toBeNull()
        })
    })

    describe('logs', () => {
        it('are carried when the engine returns them', () => {
            expect(deriveActionRunOutcome(ok({ success: false, logs: 'stderr' })).logs).toBe('stderr')
        })
        it('default to null', () => {
            expect(deriveActionRunOutcome(ok({ success: true })).logs).toBeNull()
        })
    })

    describe('neverStarted', () => {
        it('is true when the worker refused to start an expired run', () => {
            const outcome = deriveActionRunOutcome({
                result: { data: { status: EngineResponseStatus.TIMEOUT, response: { success: false, input: {}, output: null, neverStarted: true } }, error: null },
            })
            expect(outcome.status).toBe(FlowRunStatus.TIMEOUT)
            expect(outcome.neverStarted).toBe(true)
        })
        it('is false for a run the sandbox killed mid-flight', () => {
            const outcome = deriveActionRunOutcome({
                result: { data: { status: EngineResponseStatus.TIMEOUT, response: { success: false, input: {}, output: null } }, error: null },
            })
            expect(outcome.neverStarted).toBe(false)
        })
        it('is false on success', () => {
            expect(deriveActionRunOutcome(ok({ success: true })).neverStarted).toBe(false)
        })
        it('is false on the watcher-timeout channel', () => {
            const error = new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: WORKER_DID_NOT_RESPOND_MESSAGE },
            })
            expect(deriveActionRunOutcome({ result: { data: null, error } }).neverStarted).toBe(false)
        })
    })
})
