import { isNil } from '../../common'
import { FlowActionType } from '../../flows/actions/action'
import { LoopStepOutput, StepOutput, StepOutputStatus } from './step-output'

export const executionJournal = {
  
    upsertStep({ stepName, stepOutput, path, steps, createLoopIterationIfNotExists }: UpsertStepParams): Record<string, StepOutput> {
        const target = createLoopIterationIfNotExists ? this.getOrCreateStateAtPath({ path, steps }) : this.getStateAtPath({ path, steps })
        target[stepName] = stepOutput
        return steps
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

    /*
     * if the steps object does not include loop step mentioned in the path, it gets created.
     * same for the iteration in the path. If the iteration is not found, it gets created.
     */
    getOrCreateStateAtPath({ path, steps }: GetStateAtPathParams): Record<string, StepOutput> {
        let target = steps
    
        for (const [parentStepName, iteration] of path) {
            let step = target[parentStepName]
            if (!step ) {
                step = LoopStepOutput.init({ input: null })
            }
            if (step.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new Error(`Step ${parentStepName} is not a loop on items step in path ${path}`)
            }
            let loopStepOutput = step as LoopStepOutput
            let iterationOutput = loopStepOutput.output?.iterations[iteration]
            if (!iterationOutput ) {
                loopStepOutput = loopStepOutput.setItemAndIndex({ item: undefined, index: iteration }).addIteration()
                iterationOutput = loopStepOutput.output?.iterations[iteration] ?? {}
            } 
            target[parentStepName] = loopStepOutput
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
    stepOutput: StepOutput
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
