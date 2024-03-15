import { ActionType, FlowRunResponse, FlowRunStatus, LoopStepOutput, PauseMetadata, StepOutput, StepOutputStatus, StopResponse, assertEqual, isNil } from '@activepieces/shared'
import { StepExecutionPath } from './step-execution-path'
import { loggingUtils } from '../../helper/logging-utils'
import { nanoid } from 'nanoid'

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
    reason: FlowRunStatus.STOPPED
    stopResponse: StopResponse
} | {
    reason: FlowRunStatus.INTERNAL_ERROR
}

export class FlowExecutorContext {
    tasks: number
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput>>
    currentState: Record<string, unknown>
    pauseRequestId: string
    verdict: ExecutionVerdict
    verdictResponse: VerdictResponse | undefined
    currentPath: StepExecutionPath

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
        this.currentState = copyFrom?.currentState ?? {}
        this.verdict = copyFrom?.verdict ?? ExecutionVerdict.RUNNING
        this.verdictResponse = copyFrom?.verdictResponse ?? undefined
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
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
        assertEqual(stepOutput.type, ActionType.LOOP_ON_ITEMS, 'stepOutput.type', 'LOOP_ON_ITEMS')
        return stepOutput as LoopStepOutput
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

        return new FlowExecutorContext({
            ...this,
            tasks: this.tasks,
            currentState: {
                ...this.currentState,
                [stepName]: stepOutput.output,
            },
            steps,
        })
    }

    public setStepDuration({ stepName, duration }: SetStepDurationParams): FlowExecutorContext {
        const steps = {
            ...this.steps,
        }

        const targetMap = getStateAtPath({
            steps,
            currentPath: this.currentPath,
        })

        const stepOutput = targetMap[stepName]

        if (isNil(stepOutput)) {
            console.error(`[FlowExecutorContext#setStepDuration] Step ${stepName} not found in current path`)
            return this
        }

        targetMap[stepName].duration = duration

        return new FlowExecutorContext({
            ...this,
            steps,
        })
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
                        status: FlowRunStatus.INTERNAL_ERROR,
                    }
                }
                return {
                    ...baseExecutionOutput,
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
            case ExecutionVerdict.RUNNING:
            case ExecutionVerdict.SUCCEEDED: {
                const verdictResponse = this.verdictResponse
                if (verdictResponse?.reason === FlowRunStatus.STOPPED) {
                    return {
                        ...baseExecutionOutput,
                        status: FlowRunStatus.STOPPED,
                        stopResponse: verdictResponse.stopResponse,
                    }
                }
                return {
                    ...baseExecutionOutput,
                    status: FlowRunStatus.SUCCEEDED,
                }
            }
        }
    }
}

function getStateAtPath({ currentPath, steps }: { currentPath: StepExecutionPath, steps: Record<string, StepOutput> }): Record<string, StepOutput> {
    let targetMap = steps
    currentPath.path.forEach(([stepName, iteration]) => {
        const stepOutput = targetMap[stepName]
        if (!stepOutput.output || stepOutput.type !== ActionType.LOOP_ON_ITEMS) {
            throw new Error('[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
        }
        targetMap = stepOutput.output.iterations[iteration]
    })
    return targetMap
}

type SetStepDurationParams = {
    stepName: string
    duration: number
}
