import { applySensitivePaths, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function redactStep(step: StepOutput): StepOutput {
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const output = applySensitivePaths(step.output, step.sensitiveOutputPaths)
        if (!isLoopStepResult(output)) {
            return step
        }
        return {
            ...step,
            output: {
                ...output,
                iterations: output.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
            },
        }
    }
    return { ...step, output: applySensitivePaths(step.output, step.sensitiveOutputPaths) }
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return 'iterations' in value && Array.isArray(value.iterations)
}
