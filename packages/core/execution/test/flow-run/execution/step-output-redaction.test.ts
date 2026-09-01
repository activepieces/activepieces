import { SENSITIVE_VALUE_REDACTED, SENSITIVE_WHOLE_OUTPUT_PATH } from '../../../src/lib/engine/engine-constants'
import { FlowActionType } from '../../../src/lib/flows/actions/action'
import { redactSensitiveStepOutputs } from '../../../src/lib/flow-run/execution/step-output-redaction'
import { GenericStepOutput, StepOutput, StepOutputStatus } from '../../../src/lib/flow-run/execution/step-output'

function asPlainJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}

function pieceStep(output: unknown, sensitiveOutputPaths?: string[]): StepOutput {
    return GenericStepOutput.create({
        type: FlowActionType.PIECE,
        input: {},
        status: StepOutputStatus.SUCCEEDED,
        output,
        sensitiveOutputPaths,
    })
}

describe('redactSensitiveStepOutputs', () => {
    it('redacts a step carrying sensitiveOutputPaths when the step is plain JSON, not a class instance', () => {
        const steps = asPlainJson({ step_1: pieceStep({ token: 'secret-value' }, ['token']) })

        const result = redactSensitiveStepOutputs(steps)

        expect(result.step_1.output).toEqual({ token: SENSITIVE_VALUE_REDACTED })
    })

    it('redacts sensitive fields inside loop iterations when the loop step is plain JSON, not a class instance', () => {
        const loopStep = GenericStepOutput.create({
            type: FlowActionType.LOOP_ON_ITEMS,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { item: 'x', index: 0, iterations: [{ inner_step: pieceStep({ secret: 'value' }, ['secret']) }] },
        })
        const steps = asPlainJson({ loop_step: loopStep })

        const result = redactSensitiveStepOutputs(steps)

        const output = result.loop_step.output as { iterations: Array<Record<string, StepOutput>> }
        expect(output.iterations[0].inner_step.output).toEqual({ secret: SENSITIVE_VALUE_REDACTED })
    })

    it('redacts a router step carrying sensitiveOutputPaths when the step is plain JSON, not a class instance', () => {
        const routerStep = GenericStepOutput.create({
            type: FlowActionType.ROUTER,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { branches: [{ branchName: 'branch_1', branchIndex: 0, evaluation: true }], token: 'secret-value' },
            sensitiveOutputPaths: ['token'],
        })
        const steps = asPlainJson({ router_step: routerStep })

        const result = redactSensitiveStepOutputs(steps)

        expect(result.router_step.output).toEqual({
            branches: [{ branchName: 'branch_1', branchIndex: 0, evaluation: true }],
            token: SENSITIVE_VALUE_REDACTED,
        })
    })

    it("redacts a loop step's own item when the loop carries sensitiveOutputPaths", () => {
        const loopStep = GenericStepOutput.create({
            type: FlowActionType.LOOP_ON_ITEMS,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { item: { apiKey: 'sk-real' }, index: 1, iterations: [{}] },
            sensitiveOutputPaths: ['item'],
        })
        const steps = asPlainJson({ loop_step: loopStep })

        const result = redactSensitiveStepOutputs(steps)

        const output = result.loop_step.output as { item: unknown, iterations: unknown[] }
        expect(output.item).toBe(SENSITIVE_VALUE_REDACTED)
        expect(output.iterations).toEqual([{}])
    })

    it('honours the whole-output sentinel', () => {
        const steps = asPlainJson({ step_1: pieceStep({ nested: { token: 'sk-real' } }, [SENSITIVE_WHOLE_OUTPUT_PATH]) })

        const result = redactSensitiveStepOutputs(steps)

        expect(result.step_1.output).toBe(SENSITIVE_VALUE_REDACTED)
    })

    it('returns the identical steps object when nothing is sensitive, including deep loop trees', () => {
        const loopStep = GenericStepOutput.create({
            type: FlowActionType.LOOP_ON_ITEMS,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { item: 'x', index: 0, iterations: [{ inner_step: pieceStep({ plain: 'value' }) }] },
        })
        const steps = asPlainJson({ loop_step: loopStep, other: pieceStep({ a: 1 }) })

        const result = redactSensitiveStepOutputs(steps)

        expect(result).toBe(steps)
    })
})
