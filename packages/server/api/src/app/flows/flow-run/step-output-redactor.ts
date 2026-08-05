import { isNil } from '@activepieces/core-utils'
import { applySensitivePaths, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    return Object.fromEntries(entries)
}

function redactStep(step: StepOutput): StepOutput {
    const { sensitiveOutputPaths, ...rest } = step
    let output: unknown = applySensitivePaths(rest.output, sensitiveOutputPaths)
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopOutput = output as LoopStepResult | undefined
        if (!isNil(loopOutput) && Array.isArray(loopOutput.iterations)) {
            output = {
                ...loopOutput,
                iterations: loopOutput.iterations.map((iteration) => redactSensitiveStepOutputs(iteration)),
            }
        }
    }
    return { ...rest, output } as StepOutput
}
