import { isNil } from '@activepieces/core-utils'
import { applySensitivePaths, FlowActionType, FlowTriggerType, GenericStepOutput, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function withOutput<T extends FlowActionType | FlowTriggerType, OUTPUT>(step: GenericStepOutput<T, OUTPUT>, output: OUTPUT): GenericStepOutput<T, OUTPUT> {
    return new GenericStepOutput<T, OUTPUT>({ ...step, output })
}

function redactStep(step: StepOutput): StepOutput {
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        if (!isLoopStepResult(step.output)) {
            return step
        }
        return withOutput(step, {
            ...step.output,
            iterations: step.output.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
        })
    }
    if (step.type === FlowActionType.ROUTER) {
        return redactLeafStep(step)
    }
    return redactLeafStep(step)
}

function redactLeafStep<T extends FlowActionType | FlowTriggerType>(step: GenericStepOutput<T, unknown>): GenericStepOutput<T, unknown> {
    if (isNil(step.sensitiveOutputPaths) || step.sensitiveOutputPaths.length === 0) {
        return step
    }
    return withOutput(step, applySensitivePaths(step.output, step.sensitiveOutputPaths))
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return 'iterations' in value && Array.isArray(value.iterations)
}
