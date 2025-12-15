import { assertEqual, EngineGenericError, FailedStep, FlowActionType, FlowRunStatus, GenericStepOutput, isNil, LoopStepOutput, LoopStepResult, PauseMetadata, PauseType, RespondResponse, StepOutput, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { loggingUtils } from '../../helper/logging-utils'
import { StepExecutionPath } from './step-execution-path'


export type FlowVerdict = {
    status: FlowRunStatus.PAUSED
    pauseMetadata: PauseMetadata
} | {
    status: FlowRunStatus.SUCCEEDED
    stopResponse: RespondResponse | undefined
} | {
    status: FlowRunStatus.FAILED
    failedStep: FailedStep
} | {
    status: FlowRunStatus.RUNNING
} 

export class FlowExecutorContext {
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput>>
    pauseRequestId: string
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
        this.pauseRequestId = copyFrom?.pauseRequestId ?? nanoid()
        this.duration = copyFrom?.duration ?? -1
        this.verdict = copyFrom?.verdict ?? { status: FlowRunStatus.RUNNING }
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
        this.stepNameToTest = copyFrom?.stepNameToTest ?? false
        this.stepsCount = copyFrom?.stepsCount ?? 0
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

    public getDelayedInSeconds(): number | undefined {
        if (this.verdict.status === FlowRunStatus.PAUSED && this.verdict.pauseMetadata.type === PauseType.DELAY) {
            return dayjs(this.verdict.pauseMetadata.resumeDateTime).diff(Date.now(), 'seconds')
        }
        return undefined
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

    public trimmedSteps(): Promise<Record<string, StepOutput>> {
        return loggingUtils.trimExecution(this.steps)
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

    public upsertStep(stepName: string, stepOutput: StepOutput): FlowExecutorContext {
        const steps = {
            ...this.steps,
        }
        const targetMap = getStateAtPath({ currentPath: this.currentPath, steps })
        targetMap[stepName] = stepOutput

        return new FlowExecutorContext({
            ...this,
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

   
    public currentState(): Record<string, unknown> {
        let flattenedSteps: Record<string, unknown> = extractOutput(this.steps)
        let targetMap = this.steps
        this.currentPath.path.forEach(([stepName, iteration]) => {
            const stepOutput = targetMap[stepName]
            if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new EngineGenericError('NotInstanceOfLoopOnItemsStepOutputError', '[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
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
            throw new EngineGenericError('NotInstanceOfLoopOnItemsStepOutputError', `[ExecutionState#getTargetMap] Not instance of Loop On Items step output: ${stepOutput.type}`)
        }
        targetMap = stepOutput.output.iterations[iteration]
    })
    return targetMap
}


