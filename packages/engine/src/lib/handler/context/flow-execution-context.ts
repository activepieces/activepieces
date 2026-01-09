import { assertEqual, assertNotNullOrUndefined, EngineGenericError, FailedStep, FlowActionType, FlowExecutorSteps, FlowRunStatus, GenericStepOutput, GetStepOutputRequest, isNil, LoopStepOutput, LoopStepResult, PauseMetadata, PauseType, RespondResponse, StepOutput, StepOutputStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { loggingUtils } from '../../helper/logging-utils'
import { StepExecutionPath } from './step-execution-path'
import { flowStateService } from '../../services/flow-state.service'


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
    runId: string
    tags: readonly string[]
    steps: Readonly<FlowExecutorSteps>
    pauseRequestId: string
    verdict: FlowVerdict
    currentPath: StepExecutionPath
    stepNameToTest?: boolean
    stepsCount: number

    /**
     * Execution time in milliseconds
     */
    duration: number

    constructor(copyFrom?: { runId: string } & Partial<FlowExecutorContext>) {
        if (copyFrom) assertNotNullOrUndefined(copyFrom.runId, 'runId')
        this.runId = copyFrom?.runId ?? ""
        this.tags = copyFrom?.tags ?? []
        this.steps = copyFrom?.steps ?? {}
        this.pauseRequestId = copyFrom?.pauseRequestId ?? nanoid()
        this.duration = copyFrom?.duration ?? -1
        this.verdict = copyFrom?.verdict ?? { status: FlowRunStatus.RUNNING }
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
        this.stepNameToTest = copyFrom?.stepNameToTest ?? false
        this.stepsCount = copyFrom?.stepsCount ?? 0
    }

    static empty(runId: string): FlowExecutorContext {
        return new FlowExecutorContext({
            runId,
        })
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

    // public trimmedSteps(): Promise<Record<string, StepOutput>> {
    //     return loggingUtils.trimExecution(this.steps)
    // }

    public async getLoopStepOutput({ stepName }: { stepName: string }): Promise<LoopStepOutput | undefined> {
        const { result: stateAtPath } = await getStateAtPath(this)
        const stepOutput = stateAtPath?.[stepName]
        if (isNil(stepOutput)) {
            return undefined
        }
        assertEqual(stepOutput.type, FlowActionType.LOOP_ON_ITEMS, 'stepOutput.type', 'LOOP_ON_ITEMS')
        // The new LoopStepOutput is needed as casting directly to LoopClassOutput will just cast the data but the class methods will not be available
        return new LoopStepOutput(stepOutput as GenericStepOutput<FlowActionType.LOOP_ON_ITEMS, LoopStepResult>)
    }

    public async isCompleted({ stepName }: { stepName: string }): Promise<boolean> {
        const { result: stateAtPath } = await getStateAtPath(this)
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status !== StepOutputStatus.PAUSED
    }

    public async isPaused({ stepName }: { stepName: string }): Promise<boolean> {
        const { result: stateAtPath } = await getStateAtPath(this)
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

    public async upsertStep(stepName: string, stepOutput: StepOutput): Promise<FlowExecutorContext> {
        const steps = {
            ...this.steps,
        }
        const { targetMap } = await getStateAtPath(this)
        await flowStateService.saveStepOutput({
            runId: this.runId,
            stepName,
            path: this.currentPath.path as [string, number][],
            stepOutput,
        })

        targetMap[stepName] = {
            runId: this.runId,
            stepName,
            path: this.currentPath.path as [string, number][],
        }

        return new FlowExecutorContext({
            ...this,
            steps,
        })
    }

    public async getStepOutput(stepName: string): Promise<StepOutput | undefined> {
        const { result: stateAtPath } = await getStateAtPath(this)

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

   
    // TODO(@chaker): to be removed
    public async currentState(): Promise<Record<string, unknown>> {
        const resolvedSteps = await Promise.all(
            Object.entries(this.steps).map(async ([stepName, request]) =>  [stepName, await flowStateService.getStepOutputOrThrow(request)] as [string, StepOutput])
        )
        const stepsMap: Record<string, StepOutput> = Object.fromEntries(resolvedSteps)
        
        let flattenedSteps: Record<string, unknown> = extractOutput(stepsMap)
        let targetMap: FlowExecutorSteps = this.steps
        
        for (const [stepName, iteration] of this.currentPath.path) {
            const stepOutput = await flowStateService.getStepOutputOrThrow(targetMap[stepName])
            
            if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new EngineGenericError(
                    'NotInstanceOfLoopOnItemsStepOutputError',
                    `[ExecutionState#currentState] Not instance of Loop On Items step output: ${stepOutput.type}`
                )
            }
            
            targetMap = stepOutput.output.iterations[iteration]
            
            const iterationResolvedSteps = await Promise.all(
                Object.entries(targetMap).map(async ([stepName, request]) => [stepName, await flowStateService.getStepOutputOrThrow(request)] as [string, StepOutput])
            )
            const iterationStepsMap: Record<string, StepOutput> = Object.fromEntries(iterationResolvedSteps)
            
            flattenedSteps = {
                ...flattenedSteps,
                ...extractOutput(iterationStepsMap),
            }
        }
        
        return flattenedSteps
    }

}

function extractOutput(steps: Record<string, StepOutput>): Record<string, unknown> {
    return Object.entries(steps).reduce((acc: Record<string, unknown>, [stepName, step]) => {
        acc[stepName] = step.output
        return acc
    }, {} as Record<string, unknown>)
}

async function getStateAtPath({ currentPath, steps, runId }: FlowExecutorContext): Promise<{
    targetMap: FlowExecutorSteps // reference to the record with step promises
    result: Record<string, StepOutput> // direct step outputs at the current path
}> {
    let targetMap = steps
    let result: Record<string, StepOutput> = {}

    if (currentPath.path.length === 0) {
        return { targetMap, result }
    }
    const stepPromises = currentPath.path.map(([stepName]) => flowStateService.getStepOutputOrThrow(targetMap[stepName]))
    const stepOutputs = await Promise.all(stepPromises)

    for (let i = 0; i < currentPath.path.length; i++) {
        const [stepName, iteration] = currentPath.path[i]
        const stepOutput = stepOutputs[i]

        if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
            throw new EngineGenericError('NotInstanceOfLoopOnItemsStepOutputError', `[ExecutionState#getTargetMap] Not instance of Loop On Items step output: ${stepOutput.type}`)
        }
        targetMap = stepOutput.output.iterations[iteration]
        result[stepName] = stepOutput
    }

    return { targetMap, result }
}



