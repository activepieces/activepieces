import { afterEach, describe, expect, it, vi } from 'vitest'
import { TurnToolCall } from './agent-turn'
import { evalChecks } from './checks'

describe('evalChecks.targetCallFailure', () => {
    const evalCase = { cutBeforeStep: 2, targetTool: 'ap_add_step' }
    const call = (overrides: Partial<TurnToolCall>): TurnToolCall => ({ toolName: 'ap_add_step', input: { flowId: 'f1' }, output: { success: true }, errorText: undefined, errored: false, ...overrides })

    it('passes when the target call succeeded', () => {
        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [call({})] })).toBeNull()
    })

    it('fails when the target call was rejected', () => {
        const failure = evalChecks.targetCallFailure({ evalCase, toolCalls: [call({ errored: true, errorText: 'Invalid input for tool ap_add_step' })] })

        expect(failure).toContain('ap_add_step')
        expect(failure).toContain('Invalid input')
    })

    it('leaves a target call the replay stopped to the judge', () => {
        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [call({ output: { error: 'This tool is unavailable right now.' } })] })).toBeNull()
    })

    it('fails when the target call returned an error result', () => {
        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [call({ output: { success: false, message: 'step not found' } })] })).not.toBeNull()
        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [call({ output: { isError: true, content: [] } })] })).not.toBeNull()
    })

    it('finds the target inside an ap_lazy_tool call', () => {
        const lazy = call({ toolName: 'ap_lazy_tool', input: { tool: 'ap_add_step', input: { flowId: 'f1' } }, output: { error: 'step not found' } })

        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [lazy] })).not.toBeNull()
    })

    it('ignores failures of other tools', () => {
        expect(evalChecks.targetCallFailure({ evalCase, toolCalls: [call({ toolName: 'ap_list_flows', errored: true, errorText: 'boom' }), call({})] })).toBeNull()
    })

    it('does not apply when the case has no target or no cut point', () => {
        const failed = [call({ errored: true, errorText: 'boom' })]

        expect(evalChecks.targetCallFailure({ evalCase: { cutBeforeStep: 2, targetTool: undefined }, toolCalls: failed })).toBeNull()
        expect(evalChecks.targetCallFailure({ evalCase: { cutBeforeStep: undefined, targetTool: 'ap_add_step' }, toolCalls: failed })).toBeNull()
    })
})

describe('evalChecks.grade', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('scores a judge outage as unknown, not as a failure', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })))
        const evalCase = { id: 'c1', caseNumber: 1, title: 't', problemType: 'core', checks: ['asks a question'], cutBeforeStep: undefined, targetTool: undefined, preloadedSkills: [], userMessage: 'hi', messages: [], steps: [], recordedToolCalls: [] }
        const outcome = { transcript: 'ASSISTANT: hello', rejectedToolInputs: [], toolCalls: [], stops: [], newFixtures: [], costUsd: 0, steps: 1 }

        const scores = await evalChecks.grade({ evalCase, outcome, auth: { apiKey: 'k' } })

        expect(scores.expected).toBe('unknown')
        expect(scores.honest).toBe('unknown')
        expect(evalChecks.verdictOf({ scores })).toBe('unknown')
    }, 15_000)
})
