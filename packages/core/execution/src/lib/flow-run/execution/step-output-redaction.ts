import { isNil } from '@activepieces/core-utils'
import { FlowActionType } from '../../flows/actions/action'
import { FlowTriggerType } from '../../flows/triggers/trigger'
import { applySensitivePaths } from './sensitive-path-utils'
import { GenericStepOutput, LoopStepResult, StepOutput } from './step-output'

export function redactSensitiveStepOutputs(steps: Record<string, StepOutput>): Record<string, StepOutput> {
    const entries = Object.entries(steps).map(([name, step]) => [name, redactStep(step)] as const)
    const changed = entries.some(([name, step]) => step !== steps[name])
    return changed ? Object.fromEntries(entries) : steps
}

function redactStep(step: StepOutput): StepOutput {
    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const output = step.output
        if (!isLoopStepResult(output)) {
            return step
        }
        const redacted = redactLoopResult(output, step.sensitiveOutputPaths)
        return redacted === output ? step : withOutput(step, redacted)
    }
    if (step.type === FlowActionType.ROUTER) {
        return redactLeafStep(step)
    }
    return redactLeafStep(step)
}

function redactLoopResult(output: LoopStepResult, paths: string[] | undefined): LoopStepResult {
    const iterations = output.iterations.map((iteration) => redactSensitiveStepOutputs(iteration))
    const iterationsChanged = iterations.some((iteration, index) => iteration !== output.iterations[index])
    const base = iterationsChanged ? { ...output, iterations } : output
    if (isNil(paths) || paths.length === 0) {
        return base
    }
    const redacted = applySensitivePaths(base, paths)
    return isLoopStepResult(redacted) ? redacted : base
}

function redactLeafStep<T extends FlowActionType | FlowTriggerType>(step: GenericStepOutput<T, unknown>): GenericStepOutput<T, unknown> {
    const paths = step.sensitiveOutputPaths
    if (isNil(paths) || paths.length === 0) {
        return step
    }
    const output = applySensitivePaths(step.output, paths)
    return output === step.output ? step : withOutput(step, output)
}

function withOutput<T extends FlowActionType | FlowTriggerType, OUTPUT>(step: GenericStepOutput<T, OUTPUT>, output: OUTPUT): GenericStepOutput<T, OUTPUT> {
    return new GenericStepOutput<T, OUTPUT>({ ...step, output })
}

function isLoopStepResult(value: unknown): value is LoopStepResult {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    return 'iterations' in value && Array.isArray(value.iterations)
}
