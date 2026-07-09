import { EngineResponseStatus, FlowRunStatus } from '@activepieces/shared'
import { adhocRunOutcome } from '../../../../src/app/adhoc-run/adhoc-run-outcome'

// A NUL byte is one of the sequences sanitizeObjectForPostgresql strips from strings.
const NUL = String.fromCharCode(0)

function ok(overrides: { success: boolean, output?: unknown, message?: string, logs?: string }) {
    return {
        engineResult: {
            kind: 'response' as const,
            value: {
                status: EngineResponseStatus.OK,
                response: { success: overrides.success, input: {}, output: overrides.output, message: overrides.message },
                ...(overrides.logs !== undefined ? { logs: overrides.logs } : {}),
            },
        },
        input: {},
    }
}

describe('adhocRunOutcome.derive', () => {
    describe('status table', () => {
        it('OK + success maps to SUCCEEDED', () => {
            expect(adhocRunOutcome.derive(ok({ success: true })).status).toBe(FlowRunStatus.SUCCEEDED)
        })
        it('OK + failure maps to FAILED', () => {
            expect(adhocRunOutcome.derive(ok({ success: false })).status).toBe(FlowRunStatus.FAILED)
        })
        it('TIMEOUT maps to TIMEOUT', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.TIMEOUT, response: { success: false, input: {}, output: null } } },
                input: {},
            })
            expect(outcome.status).toBe(FlowRunStatus.TIMEOUT)
        })
        it('any other engine status maps to INTERNAL_ERROR', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.USER_FAILURE, response: { success: false, input: {}, output: null } } },
                input: {},
            })
            expect(outcome.status).toBe(FlowRunStatus.INTERNAL_ERROR)
        })
        it('error channel maps to INTERNAL_ERROR', () => {
            const outcome = adhocRunOutcome.derive({ engineResult: { kind: 'error', error: new Error('boom') }, input: {} })
            expect(outcome.status).toBe(FlowRunStatus.INTERNAL_ERROR)
        })
    })

    describe('errorMessage precedence', () => {
        it('is null on success', () => {
            expect(adhocRunOutcome.derive(ok({ success: true })).errorMessage).toBeNull()
        })
        it('prefers response.message when present', () => {
            expect(adhocRunOutcome.derive(ok({ success: false, message: 'bad field' })).errorMessage).toBe('bad field')
        })
        it('falls back to engine error field', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.INTERNAL_ERROR, response: { success: false, input: {}, output: null }, error: 'engine exploded' } },
                input: {},
            })
            expect(outcome.errorMessage).toBe('engine exploded')
        })
        it('is null on failure with neither message nor error', () => {
            expect(adhocRunOutcome.derive(ok({ success: false })).errorMessage).toBeNull()
        })
        it('error channel uses Error.message', () => {
            expect(adhocRunOutcome.derive({ engineResult: { kind: 'error', error: new Error('boom') }, input: {} }).errorMessage).toBe('boom')
        })
        it('error channel stringifies non-Error', () => {
            expect(adhocRunOutcome.derive({ engineResult: { kind: 'error', error: 'plain string' }, input: {} }).errorMessage).toBe('plain string')
        })
    })

    describe('output', () => {
        it('is carried and sanitized on success', () => {
            const outcome = adhocRunOutcome.derive(ok({ success: true, output: { note: `a${NUL}b` } }))
            expect(outcome.output).toEqual({ note: 'ab' })
        })
        it('is null on failure', () => {
            expect(adhocRunOutcome.derive(ok({ success: false, output: { data: 1 } })).output).toBeNull()
        })
        it('is null on the error channel', () => {
            expect(adhocRunOutcome.derive({ engineResult: { kind: 'error', error: new Error('x') }, input: {} }).output).toBeNull()
        })
    })

    describe('input', () => {
        it('is always sanitized', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.OK, response: { success: true, input: {}, output: null } } },
                input: { note: `x${NUL}y` },
            })
            expect(outcome.input).toEqual({ note: 'xy' })
        })
    })

    describe('hasPayload gate', () => {
        it('is true when output is present', () => {
            expect(adhocRunOutcome.derive(ok({ success: true, output: { data: 1 } })).hasPayload).toBe(true)
        })
        it('is true when logs are present', () => {
            expect(adhocRunOutcome.derive(ok({ success: false, logs: 'stderr' })).hasPayload).toBe(true)
        })
        it('is true when input is present', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.OK, response: { success: true, input: {}, output: null } } },
                input: { anything: true },
            })
            expect(outcome.hasPayload).toBe(true)
        })
        it('is false when input, output, and logs are all nil', () => {
            const outcome = adhocRunOutcome.derive({
                engineResult: { kind: 'response', value: { status: EngineResponseStatus.OK, response: { success: true, input: {}, output: null } } },
                input: null,
            })
            expect(outcome.hasPayload).toBe(false)
        })
    })
})
