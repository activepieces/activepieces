import { isNil } from '@activepieces/core-utils'
import { applySensitivePaths, FlowActionType, GenericStepOutput, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function redactStep(step: StepOutput): StepOutput {
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        return redactLoopStep(step)
    }
    const redactedOutput = applySensitivePaths(step.output, step.sensitiveOutputPaths)
    return step.setOutput(redactedOutput).setSensitiveOutputPaths(undefined)
}

function redactLoopStep(step: GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>): StepOutput {
    const redactedOutput = applySensitivePaths(step.output, step.sensitiveOutputPaths)
    if (!isLoopStepResult(redactedOutput)) {
        return step.setSensitiveOutputPaths(undefined)
    }
    const withRedactedIterations: LoopStepResult = {
        ...redactedOutput,
        iterations: redactedOutput.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
    }
    return step.setOutput(withRedactedIterations).setSensitiveOutputPaths(undefined)
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (isNil(value) || typeof value !== 'object') {
        return false
    }
    if (!('iterations' in value)) {
        return false
    }
    return Array.isArray(value.iterations)
}
