import { isNil } from '@activepieces/core-utils'
import { FlowActionType } from '../../flows/actions/action'
import { BaseStepOutput, LoopStepOutput, StepOutput, StepOutputStatus } from './step-output'

export const executionJournal = {
  
    upsertStep({ stepName, stepOutput, path, steps, createLoopIterationIfNotExists }: UpsertStepParams): Record<string, StepOutput> {
        if (path.length === 0) {
            return Object.assign({}, steps, { [stepName]: stepOutput })
        }
        const [[parentStepName, iteration], ...remainingPath] = path
        const parentStep = steps[parentStepName] ?? (createLoopIterationIfNotExists ? LoopStepOutput.init({ input: null }) : undefined)
        if (isNil(parentStep)) {
            throw new Error(`Step ${parentStepName} not found in path ${path}`)
        }
        if (parentStep.type !== FlowActionType.LOOP_ON_ITEMS) {
            throw new Error(`Step ${parentStepName} is not a loop on items step in path ${path}`)
        }
        const iterations = [...parentStep.output?.iterations ?? []]
        const iterationOutput = iterations[iteration]
        if (isNil(iterationOutput) && !createLoopIterationIfNotExists) {
            throw new Error(`Iteration ${iteration} not found in path ${path}`)
        }
        while (iterations.length <= iteration) {
            iterations.push({})
        }
        iterations[iteration] = this.upsertStep({
            stepName,
            stepOutput,
            path: remainingPath,
            steps: iterationOutput ?? {},
            createLoopIterationIfNotExists,
        })
        return {
            ...steps,
            [parentStepName]: new LoopStepOutput({
                ...parentStep,
                output: {
                    item: parentStep.output?.item,
                    index: parentStep.output?.index ?? 0,
                    iterations,
                },
            }),
        }
    },

    getStep({ stepName, path, steps }: GetStepParams): StepOutput | undefined {
        return this.getStateAtPath({ path, steps })[stepName]
    },

    getStateAtPath({ path, steps }: GetStateAtPathParams): Record<string, StepOutput> {
        let target = steps

        for (const [parentStepName, iteration] of path) {
            const step = target[parentStepName]
            if (!step) {
                throw new Error(`Step ${parentStepName} not found in path ${path}`)
            }
            if (step.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new Error(`Step ${parentStepName} is not a loop on items step in path ${path}`)
            }
            const loopStepOutput = step as LoopStepOutput
            const iterationOutput = loopStepOutput.output?.iterations[iteration]
            if (!iterationOutput) {
                throw new Error(`Iteration ${iteration} not found in path ${path}`)
            }
            target = iterationOutput
        }
        return target
    },

    findLastStepWithStatus(steps: Record<string, StepOutput>, status: StepOutputStatus | undefined): string | null {
        let lastStepWithStatus: string | null = null
        Object.entries(steps).forEach(([stepName, step]) => {
            if ( step.type === FlowActionType.LOOP_ON_ITEMS && step.output ) {
                const iterations = step.output.iterations
                iterations.forEach((iteration) => {
                    const lastOneInIteration = this.findLastStepWithStatus(iteration, status)
                    if (!isNil(lastOneInIteration)) {
                        lastStepWithStatus = lastOneInIteration
                    }
                })
            }
            if (isNil(status)) {
                lastStepWithStatus = stepName
                return
            }
            if (step.status === status) {
                lastStepWithStatus = stepName
                return
            }
        })
        return lastStepWithStatus
    },

    getLoopSteps(steps: Record<string, StepOutput>): Record<string, LoopStepOutput> {
        let result: Record<string, LoopStepOutput> = {}
        Object.entries(steps).forEach(([stepName, step]) => {
            if (step.type === FlowActionType.LOOP_ON_ITEMS) {
                const iterationsResult = step.output?.iterations.reduce((acc, iteration) => {
                    return {
                        ...acc,
                        ...this.getLoopSteps(iteration),
                    }
                }, {} as Record<string, LoopStepOutput>)
                if (isNil(iterationsResult)) {
                    result[stepName] = step as LoopStepOutput
                    return
                }
                result = {
                    ...result,
                    ...iterationsResult as Record<string, LoopStepOutput>,
                    [stepName]: step as LoopStepOutput,
                }
            }
        })
        return result
    },

    isChildOf(parent: StepOutput, child: string): boolean {
        if (parent.type !== FlowActionType.LOOP_ON_ITEMS) return false
        if (!parent.output?.iterations) return false
        for (const iteration of parent.output.iterations) {
            for (const [name, output] of Object.entries(iteration)) {
                if (name === child) return true
                if (this.isChildOf(output, child)) return true
            }
        }
        return false
    },

    getPathToStep(
        steps: Record<string, StepOutput>,
        stepName: string,
        loopsIndexes: Record<string, number>,
        currentPath: readonly [string, number][] = [],
    ): readonly [string, number][] | undefined {


        for (const [currentStepName, step] of Object.entries(steps)) {
            if (currentStepName === stepName) {
                return currentPath
            }

            if (step.type !== FlowActionType.LOOP_ON_ITEMS) continue
            if (!step.output?.iterations) continue

            for (const iteration of step.output.iterations) {
                const nestedPath = this.getPathToStep(iteration, stepName, loopsIndexes, [...currentPath, [currentStepName, loopsIndexes[currentStepName]]])
                if (nestedPath) return nestedPath
            }
        }
        return undefined
    },
}

export type UpsertStepParams = {
    stepName: string
    stepOutput: BaseStepOutput
    path: readonly [string, number][]
    steps: Record<string, StepOutput>
    createLoopIterationIfNotExists?: boolean
}

export type GetStepParams = {
    stepName: string
    path: readonly [string, number][]
    steps: Record<string, StepOutput>
}

export type GetStateAtPathParams = {
    path: readonly [string, number][]
    steps: Record<string, StepOutput>
}
