import { applySensitivePaths, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function redactStep(step: StepOutput): StepOutput {
    const { sensitiveOutputPaths, ...rest } = step
    const output = applySensitivePaths(rest.output, sensitiveOutputPaths)
    if (step.type !== FlowActionType.LOOP_ON_ITEMS || !isLoopStepResult(output)) {
        return { ...rest, output } as StepOutput
    }
    const withRedactedIterations: LoopStepResult = {
        ...output,
        iterations: output.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
    }
    return { ...rest, output: withRedactedIterations } as StepOutput
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return 'iterations' in value && Array.isArray(value.iterations)
}
