import { assertEqual, BaseStepOutput, DehydratedRef, EngineGenericError, executionJournal, FailedStep, FlowActionType, FlowRunStatus, GenericStepOutput, isDehydratedRef, isNil, LoopStepOutput, LoopStepResult, RespondResponse, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { loggingUtils } from '../../helper/logging-utils'
import { StepExecutionPath } from './step-execution-path'


export class FlowExecutorContext {
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput>>
    verdict: FlowVerdict
    currentPath: StepExecutionPath
    stepNameToTest?: boolean
    stepsCount: number

    /**
     * Execution time in milliseconds
     */
    duration: number

    constructor(copyFrom?: FlowExecutorContext) {
        this.tags = copyFrom?.tags ?? []
        this.steps = copyFrom?.steps ?? {}
        this.duration = copyFrom?.duration ?? -1
        this.verdict = copyFrom?.verdict ?? { status: FlowRunStatus.RUNNING }
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
        this.stepNameToTest = copyFrom?.stepNameToTest ?? false
        this.stepsCount = copyFrom?.stepsCount ?? 0
    }

    static empty(): FlowExecutorContext {
        return new FlowExecutorContext()
    }

    public finishExecution(): FlowExecutorContext {
        if (this.verdict.status === FlowRunStatus.RUNNING) {
            return new FlowExecutorContext({
                ...this,
                verdict: { status: FlowRunStatus.SUCCEEDED },
            })
        }
        return this
    }

    public getLoopStepOutput({ stepName }: { stepName: string }): LoopStepOutput | undefined {
        const stateAtPath = executionJournal.getStateAtPath({ path: this.currentPath.path, steps: this.steps })

        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return undefined
        }
        assertEqual(stepOutput.type, FlowActionType.LOOP_ON_ITEMS, 'stepOutput.type', 'LOOP_ON_ITEMS')
        return new LoopStepOutput(stepOutput as GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>)
    }

    public isCompleted({ stepName }: { stepName: string }): boolean {
        const stateAtPath = executionJournal.getStateAtPath({ path: this.currentPath.path, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status !== StepOutputStatus.PAUSED
    }

    public isPaused({ stepName }: { stepName: string }): boolean {
        const stateAtPath = executionJournal.getStateAtPath({ path: this.currentPath.path, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status === StepOutputStatus.PAUSED
    }

    public setDuration(duration: number): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            duration,
        })
    }


    public addTags(tags: string[]): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            tags: [...this.tags, ...tags].filter((value, index, self) => {
                return self.indexOf(value) === index
            }),
        })
    }

    public upsertStep(stepName: string, stepOutput: BaseStepOutput): FlowExecutorContext {
        const steps = executionJournal.upsertStep({ stepName, stepOutput, path: this.currentPath.path, steps: this.steps })
        const trimmedSteps = this.currentPath.path.length === 0 ? loggingUtils.trimExecutionInput(steps) : steps
        return new FlowExecutorContext({
            ...this,
            steps: trimmedSteps,
        })
    }

    public getStepOutput(stepName: string, path?: StepExecutionPath['path']): StepOutput | undefined {
        return executionJournal.getStep({ stepName, path: path ?? this.currentPath.path, steps: this.steps })
    }

    public setCurrentPath(currentStatePath: StepExecutionPath): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            currentPath: currentStatePath,
        })
    }

    public setVerdict(verdict: FlowVerdict): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            verdict,
        })
    }

    public setRetryable(retryable: boolean): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            retryable,
        })
    }

    public incrementStepsExecuted(): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            stepsCount: this.stepsCount + 1,
        })
    }

    public async currentState(referencedStepNames?: string[], hydrator?: RefHydrator): Promise<Record<string, unknown>> {
        const referencedSteps = referencedStepNames
            ? referencedStepNames.reduce((acc, stepName) => {
                if (this.steps[stepName]) acc[stepName] = this.steps[stepName]
                return acc
            }, {} as Record<string, StepOutput>)
            : this.steps

        let flattenedSteps: Record<string, unknown> = await extractOutput(referencedSteps, hydrator)
        let targetMap = this.steps

        for (const [stepName, iteration] of this.currentPath.path) {
            const stepOutput = targetMap[stepName]
            if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new EngineGenericError('NotInstanceOfLoopOnItemsStepOutputError', '[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
            }
            const iterationsRaw = stepOutput.output.iterations[iteration]
            const hydratedIteration = await hydrateIterationIfNeeded(iterationsRaw, hydrator)
            targetMap = hydratedIteration
            flattenedSteps = {
                ...flattenedSteps,
                ...await extractOutput(targetMap, hydrator),
            }
        }
        return flattenedSteps
    }
}

async function extractOutput(steps: Record<string, StepOutput>, hydrator: RefHydrator | undefined): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    for (const [stepName, step] of Object.entries(steps)) {
        result[stepName] = await maybeHydrate(step.output, hydrator)
    }
    return result
}

async function maybeHydrate(value: unknown, hydrator: RefHydrator | undefined): Promise<unknown> {
    if (!isDehydratedRef(value)) {
        return value
    }
    if (isNil(hydrator)) {
        throw new EngineGenericError('SpoolHydratorMissingError', `Encountered dehydrated ref ${value.fileId} without a hydrator`)
    }
    return hydrator(value)
}

async function hydrateIterationIfNeeded(iteration: unknown, hydrator: RefHydrator | undefined): Promise<Record<string, StepOutput>> {
    if (isDehydratedRef(iteration)) {
        if (isNil(hydrator)) {
            throw new EngineGenericError('SpoolHydratorMissingError', `Encountered dehydrated iteration ${iteration.fileId} without a hydrator`)
        }
        return await hydrator(iteration) as Record<string, StepOutput>
    }
    return iteration as Record<string, StepOutput>
}

export type RefHydrator = (ref: DehydratedRef) => Promise<unknown>

export type FlowVerdict = {
    status: FlowRunStatus.PAUSED
} | {
    status: FlowRunStatus.SUCCEEDED
    stopResponse: RespondResponse | undefined
} | {
    status: FlowRunStatus.FAILED | FlowRunStatus.LOG_SIZE_EXCEEDED
    failedStep: FailedStep
} | {
    status: FlowRunStatus.RUNNING
}
