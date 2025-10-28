import { assertEqual, FlowActionType, FlowError, FlowRunResponse, FlowRunStatus, GenericStepOutput, isNil, LoopStepOutput, LoopStepResult, PauseMetadata, RespondResponse, spreadIfDefined, StepOutput, StepOutputStatus } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { loggingUtils } from '../../helper/logging-utils'
import { StepExecutionPath } from './step-execution-path'

export enum ExecutionVerdict {
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export type VerdictResponse = {
    reason: FlowRunStatus.PAUSED
    pauseMetadata: PauseMetadata
} | {
    reason: FlowRunStatus.SUCCEEDED
    stopResponse: RespondResponse
} | {
    reason: FlowRunStatus.INTERNAL_ERROR
}

export class FlowExecutorContext {
    tasks: number
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput>>
    pauseRequestId: string
    verdict: ExecutionVerdict
    verdictResponse: VerdictResponse | undefined
    currentPath: StepExecutionPath
    error?: FlowError
    stepNameToTest?: boolean

    /**
     * Execution time in milliseconds
     */
    duration: number

    constructor(copyFrom?: FlowExecutorContext) {
        this.tasks = copyFrom?.tasks ?? 0
        this.tags = copyFrom?.tags ?? []
        this.steps = copyFrom?.steps ?? {}
        this.pauseRequestId = copyFrom?.pauseRequestId ?? nanoid()
        this.duration = copyFrom?.duration ?? -1
        this.verdict = copyFrom?.verdict ?? ExecutionVerdict.RUNNING
        this.verdictResponse = copyFrom?.verdictResponse ?? undefined
        this.error = copyFrom?.error ?? undefined
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
        this.stepNameToTest = copyFrom?.stepNameToTest ?? false
    }

    static empty(): FlowExecutorContext {
        return new FlowExecutorContext()
    }

    public setPauseRequestId(pauseRequestId: string): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            pauseRequestId,
        })
    }

    public getLoopStepOutput({ stepName }: { stepName: string }): LoopStepOutput | undefined {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return undefined
        }
        assertEqual(stepOutput.type, FlowActionType.LOOP_ON_ITEMS, 'stepOutput.type', 'LOOP_ON_ITEMS')
        // The new LoopStepOutput is needed as casting directly to LoopClassOutput will just cast the data but the class methods will not be available
        return new LoopStepOutput(stepOutput as GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>)
    }

    public isCompleted({ stepName }: { stepName: string }): boolean {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status !== StepOutputStatus.PAUSED
    }

    public isPaused({ stepName }: { stepName: string }): boolean {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
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

    public increaseTask(tasks = 1): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            tasks: this.tasks + tasks,
        })
    }

    public upsertStep(stepName: string, stepOutput: StepOutput): FlowExecutorContext {
        const steps = {
            ...this.steps,
        }
        const targetMap = getStateAtPath({ currentPath: this.currentPath, steps })
        targetMap[stepName] = stepOutput

        const error = stepOutput.status === StepOutputStatus.FAILED ? {
            stepName,
            message: stepOutput.errorMessage,
        } : this.error

        return new FlowExecutorContext({
            ...this,
            tasks: this.tasks,
            ...spreadIfDefined('error', error),
            steps,
        })
    }

    public getStepOutput(stepName: string): StepOutput | undefined {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
        return stateAtPath[stepName]
    }



    public setCurrentPath(currentStatePath: StepExecutionPath): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            currentPath: currentStatePath,
        })
    }

    public setVerdict(verdict: ExecutionVerdict, response?: VerdictResponse): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            verdict,
            verdictResponse: response,
        })
    }

    public setRetryable(retryable: boolean): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            retryable,
        })
    }

    public async toResponse(): Promise<FlowRunResponse> {
        const baseExecutionOutput = {
            duration: this.duration,
            tasks: this.tasks,
            tags: [...this.tags],
            steps: await loggingUtils.trimExecution(this.steps),
        }
        switch (this.verdict) {
            case ExecutionVerdict.FAILED: {
                const verdictResponse = this.verdictResponse
                if (verdictResponse?.reason === FlowRunStatus.INTERNAL_ERROR) {
                    return {
                        ...baseExecutionOutput,
                        error: this.error,
                        status: FlowRunStatus.INTERNAL_ERROR,
                    }
                }
                return {
                    ...baseExecutionOutput,
                    error: this.error,
                    status: FlowRunStatus.FAILED,
                }
            }
            case ExecutionVerdict.PAUSED: {
                const verdictResponse = this.verdictResponse
                if (verdictResponse?.reason !== FlowRunStatus.PAUSED) {
                    throw new Error('Verdict Response should have pause metadata response')
                }
                return {
                    ...baseExecutionOutput,
                    status: FlowRunStatus.PAUSED,
                    pauseMetadata: verdictResponse.pauseMetadata,
                }
            }
            case ExecutionVerdict.RUNNING: {
                return {
                    ...baseExecutionOutput,
                    status: FlowRunStatus.RUNNING,
                }
            }
            case ExecutionVerdict.SUCCEEDED: {
                const verdictResponse = this.verdictResponse

                return {
                    ...baseExecutionOutput,
                    status: FlowRunStatus.SUCCEEDED,
                    response: !isNil(verdictResponse) && 'stopResponse' in verdictResponse ? verdictResponse.stopResponse : undefined,
                }
            }
        }
    }
    public currentState(): Record<string, unknown> {
        let flattenedSteps: Record<string, unknown> = extractOutput(this.steps)
        let targetMap = this.steps
        this.currentPath.path.forEach(([stepName, iteration]) => {
            const stepOutput = targetMap[stepName]
            if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new Error('[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
            }
            targetMap = stepOutput.output.iterations[iteration]
            flattenedSteps = {
                ...flattenedSteps,
                ...extractOutput(targetMap),
            }
        })
        return flattenedSteps
    }


}

function extractOutput(steps: Record<string, StepOutput>): Record<string, unknown> {
    return Object.entries(steps).reduce((acc: Record<string, unknown>, [stepName, step]) => {
        acc[stepName] = step.output
        return acc
    }, {} as Record<string, unknown>)
}

function getStateAtPath({ currentPath, steps }: { currentPath: StepExecutionPath, steps: Record<string, StepOutput> }): Record<string, StepOutput> {
    let targetMap = steps
    currentPath.path.forEach(([stepName, iteration]) => {
        const stepOutput = targetMap[stepName]
        if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
            throw new Error('[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
        }
        targetMap = stepOutput.output.iterations[iteration]
    })
    return targetMap
}


