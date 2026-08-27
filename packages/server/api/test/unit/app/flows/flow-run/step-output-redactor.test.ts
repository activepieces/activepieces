import { FlowActionType, GenericStepOutput, StepOutputStatus } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { redactSensitiveStepOutputs } from '../../../../../src/app/flows/flow-run/step-output-redactor'

function asPlainJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}

describe('redactSensitiveStepOutputs', () => {
    it('redacts a step carrying sensitiveOutputPaths when the step is plain JSON, not a class instance', () => {
        const step = GenericStepOutput.create({
            type: FlowActionType.PIECE,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { token: 'secret-value' },
            sensitiveOutputPaths: ['token'],
        })
        const steps = asPlainJson({ step_1: step })

        const result = redactSensitiveStepOutputs(steps)

        expect(result.step_1.output).toEqual({ token: '**REDACTED**' })
    })

    it('redacts sensitive fields inside loop iterations when the loop step is plain JSON, not a class instance', () => {
        const innerStep = GenericStepOutput.create({
            type: FlowActionType.PIECE,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { secret: 'value' },
            sensitiveOutputPaths: ['secret'],
        })
        const loopStep = GenericStepOutput.create({
            type: FlowActionType.LOOP_ON_ITEMS,
            input: {},
            status: StepOutputStatus.SUCCEEDED,
            output: { item: 'x', index: 0, iterations: [{ inner_step: innerStep }] },
        })
        const steps = asPlainJson({ loop_step: loopStep })

        const result = redactSensitiveStepOutputs(steps)

        const output = result.loop_step.output
        expect(output.iterations[0].inner_step.output).toEqual({ secret: '**REDACTED**' })
    })
})
