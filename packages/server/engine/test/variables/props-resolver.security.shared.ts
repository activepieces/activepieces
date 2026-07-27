import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { FlowActionType, FlowTriggerType, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import type { MockInstance } from 'vitest'
import type { CodeSandbox } from '../../src/lib/core/code/code-sandbox-common'
import type { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import type { PropsResolver } from '../../src/lib/variables/props-resolver'

const STEP_NAMES = ['trigger', 'step_1', 'step_2', 'step_3', 'step_4']

// Mode-sensitive engine modules capture AP_EXECUTION_MODE at import time, so they are imported
// dynamically (inside beforeAll) — after the per-mode wrapper file has set the env. Static imports
// would be hoisted above that assignment and lock in the wrong mode.
async function buildSuccessState(): Promise<FlowExecutorContext> {
    const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
    let state = await FlowExecutorContext.empty().upsertStep('trigger', GenericStepOutput.create({
        type: FlowTriggerType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: {
            name: 'John',
            items: [5, 'a'],
            users: [{ name: 'Alice' }, { name: 'Bob' }],
        },
    }))
    state = await state.upsertStep('step_1', GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: {
            success: true,
            count: 0,
            nested: { deep: { value: 42 } },
            'weird.key': 'dotted',
            text: 'hello',
        },
    }))
    state = await state.upsertStep('step_2', GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.SUCCEEDED,
        input: {},
        output: { value: 10 },
    }))
    return state
}

async function buildFailedState(): Promise<FlowExecutorContext> {
    const { FlowExecutorContext } = await import('../../src/lib/handler/context/flow-execution-context')
    return FlowExecutorContext.empty().upsertStep('step_4', GenericStepOutput.create({
        type: FlowActionType.PIECE,
        status: StepOutputStatus.FAILED,
        input: {},
    }).setErrorMessage('Custom Runtime Error'))
}

export function runSecuritySuite(mode: string): void {
    describe(`props-resolver security (${mode})`, () => {
        let resolver: PropsResolver
        let sandbox: CodeSandbox
        let successState: FlowExecutorContext
        let failedState: FlowExecutorContext
        let runScriptSpy: MockInstance

        beforeAll(async () => {
            const { createPropsResolver } = await import('../../src/lib/variables/props-resolver')
            const { initCodeSandbox } = await import('../../src/lib/core/code/code-sandbox')
            resolver = createPropsResolver({
                projectId: 'PROJECT_ID',
                engineToken: 'WORKER_TOKEN',
                apiUrl: 'http://127.0.0.1:3000',
                contextVersion: LATEST_CONTEXT_VERSION,
                stepNames: STEP_NAMES,
            })
            successState = await buildSuccessState()
            failedState = await buildFailedState()
            sandbox = await initCodeSandbox()
            runScriptSpy = vi.spyOn(sandbox, 'runScript')
        })
        // Block body: an arrow returning the mock would be treated by vitest as a teardown
        // callback and invoked as runScript(undefined).
        beforeEach(() => { runScriptSpy.mockClear() })

        async function evalOracle(inner: string, scope: Record<string, unknown>): Promise<unknown> {
            try {
                return (await sandbox.runScript({ script: inner, scriptContext: { ...scope }, functions: {} })) ?? ''
            }
            catch {
                return ''
            }
        }

        describe('S-Proto — dangerous keys resolve to empty string, no pollution', () => {
            test.each([
                '{{__proto__}}',
                '{{constructor}}',
                '{{constructor.constructor}}',
                '{{step_1.__proto__.x}}',
                '{{step_1[\'constructor\'][\'prototype\']}}',
            ])('%s resolves to empty string', async (token) => {
                const { resolvedInput } = await resolver.resolve({ unresolvedInput: token, executionState: successState })
                expect(resolvedInput).toEqual('')
            })

            test('Object.prototype is not polluted by a resolution pass', async () => {
                await resolver.resolve({ unresolvedInput: '{{step_1.__proto__.polluted}}', executionState: successState })
                await resolver.resolve({ unresolvedInput: '{{constructor.constructor}}', executionState: successState })
                expect(({} as Record<string, unknown>).polluted).toBeUndefined()
                expect(Object.prototype.hasOwnProperty.call({}, 'polluted')).toBe(false)
            })
        })

        describe('S-FailClosed — non-plain tokens fall through to the eval sandbox', () => {
            test.each([
                '{{ upper(step_1.text) }}',
                '{{step_1.output()}}',
                '{{step_1.output || \'x\'}}',
                '{{ {"a":1} }}',
                '{{step_1.output.success ? 1 : 2}}',
                '{{step_1.output.count; step_1.output.success}}',
                '{{flattenNestedKeys(trigger.output, [\'users\',\'name\'])}}',
                '{{step_1 .output}}',
                '{{step_1.[\'output\']}}',
            ])('%s reaches runScript', async (token) => {
                await resolver.resolve({ unresolvedInput: token, executionState: successState })
                expect(runScriptSpy).toHaveBeenCalled()
            })

            test.each([
                '{{step_1.output.success}}',
                '{{trigger.output.users[0][\'name\']}}',
                '{{step_1.output[\'weird.key\']}}',
                '{{trigger.output.items[1]}}',
            ])('plain token %s never reaches runScript', async (token) => {
                await resolver.resolve({ unresolvedInput: token, executionState: successState })
                expect(runScriptSpy).not.toHaveBeenCalled()
            })
        })

        describe('S-Parity — fast path matches the eval path', () => {
            test.each([
                'trigger.output.name',
                'trigger.output.items',
                'trigger.output.items[0]',
                'trigger.output.users[1].name',
                'trigger.output.users[0][\'name\']',
                'step_1.output.success',
                'step_1.output.count',
                'step_1.output.nested.deep.value',
                'step_1.output[\'weird.key\']',
                'step_1.output.text.length',
                'step_1.output.missing',
                'step_1.output.nested.absent.deeper',
                'step_1',
                'step_99',
            ])('single-token %s equals eval result', async (inner) => {
                const scope = await successState.currentState(STEP_NAMES)
                const { resolvedInput: fast } = await resolver.resolve({ unresolvedInput: `{{${inner}}}`, executionState: successState })
                const old = await evalOracle(inner, scope)
                expect(fast).toEqual(old)
            })

            test.each([
                'step_4.output',
                'step_4.error.message',
                'step_4[\'error\'][\'message\']',
            ])('failed-step token %s equals eval result', async (inner) => {
                const scope = await failedState.currentState(['step_4'])
                const { resolvedInput: fast } = await resolver.resolve({ unresolvedInput: `{{${inner}}}`, executionState: failedState })
                const old = await evalOracle(inner, scope)
                expect(fast).toEqual(old)
            })

            test('multi-token interpolation matches eval', async () => {
                const { resolvedInput } = await resolver.resolve({
                    unresolvedInput: '{{trigger.output.name}} has {{step_1.output.count}} of {{step_1.output.success}}',
                    executionState: successState,
                })
                expect(resolvedInput).toEqual('John has 0 of true')
            })
        })

        describe('B — per-token scope narrowing (1B)', () => {
            // Expressions (not plain access) so they reach the eval sandbox and we can inspect the
            // scope object handed to runScript.
            const input = {
                fromStep1: '{{step_1.output.count + 1}}',
                fromStep2: '{{step_2.output.value + 1}}',
                fromBoth: '{{step_1.output.count + step_2.output.value}}',
            }

            function scopeKeysForScript(matcher: (script: string) => boolean): string[] {
                const call = runScriptSpy.mock.calls.find(([params]) => matcher((params as { script: string }).script))
                if (call === undefined) {
                    throw new Error('expected a runScript call matching the token')
                }
                return Object.keys((call[0] as { scriptContext: Record<string, unknown> }).scriptContext).sort()
            }

            test('B-NoDrop — narrowing keeps every step a token needs (values match)', async () => {
                const { resolvedInput } = await resolver.resolve({ unresolvedInput: input, executionState: successState })
                expect(resolvedInput).toEqual({ fromStep1: 1, fromStep2: 11, fromBoth: 10 })
            })

            test('B-Isolation — a token receives only the steps it references', async () => {
                await resolver.resolve({ unresolvedInput: input, executionState: successState })
                expect(scopeKeysForScript((s) => s.includes('step_1') && !s.includes('step_2'))).toEqual(['step_1'])
                expect(scopeKeysForScript((s) => s.includes('step_2') && !s.includes('step_1'))).toEqual(['step_2'])
                expect(scopeKeysForScript((s) => s.includes('step_1') && s.includes('step_2'))).toEqual(['step_1', 'step_2'])
            })
        })
    })
}
