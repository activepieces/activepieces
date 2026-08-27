import { isNil } from '@activepieces/core-utils'
import { applySensitivePaths, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function redactStep(step: StepOutput): StepOutput {
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        if (!isLoopStepResult(step.output)) {
            return step
        }
        return step.setOutput({
            ...step.output,
            iterations: step.output.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
        })
    }
    if (isNil(step.sensitiveOutputPaths) || step.sensitiveOutputPaths.length === 0) {
        return step
    }
    return step.setOutput(applySensitivePaths(step.output, step.sensitiveOutputPaths))
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return 'iterations' in value && Array.isArray(value.iterations)
}
