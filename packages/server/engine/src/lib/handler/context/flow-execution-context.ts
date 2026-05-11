import {
    apId,
    assertEqual,
    BaseStepOutput,
    EngineGenericError,
    executionJournal,
    FailedStep,
    FileType,
    FlowActionType,
    FlowRunStatus,
    GenericStepOutput,
    isNil,
    LogSliceRef,
    LoopStepOutput,
    LoopStepResult,
    RespondResponse,
    StepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { engineFileApi } from '../../engine-file-api'
import { loggingUtils } from '../../helper/logging-utils'
import { utils } from '../../utils'
import { StepExecutionPath } from './step-execution-path'

const DEFAULT_THRESHOLD_KB = 32
const SLICE_THRESHOLD_BYTES = Number(
    process.env.AP_FLOW_RUN_LOG_SLICE_THRESHOLD_KB ?? DEFAULT_THRESHOLD_KB,
) * 1024
const materializeCache = new Map<string, Promise<unknown>>()

export class FlowExecutorContext {
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput>>
    verdict: FlowVerdict
    currentPath: StepExecutionPath
    stepNameToTest?: boolean
    stepsCount: number
    engineApi?: EngineApiConfig

    /**
     * Execution time in milliseconds
     */
    duration: number

    constructor(copyFrom?: Partial<FlowExecutorContext>) {
        this.tags = copyFrom?.tags ?? []
        this.steps = copyFrom?.steps ?? {}
        this.duration = copyFrom?.duration ?? -1
        this.verdict = copyFrom?.verdict ?? { status: FlowRunStatus.RUNNING }
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
        this.stepNameToTest = copyFrom?.stepNameToTest ?? false
        this.stepsCount = copyFrom?.stepsCount ?? 0
        this.engineApi = copyFrom?.engineApi
    }

    static empty(engineApi?: EngineApiConfig): FlowExecutorContext {
        return new FlowExecutorContext({ engineApi })
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

    public async upsertStep(stepName: string, stepOutput: BaseStepOutput): Promise<FlowExecutorContext> {
        let finalized: BaseStepOutput
        if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
            finalized = stepOutput
        }
        else {
            const sliced = await maybeSliceOutput(stepOutput.output, this.engineApi)
            finalized = new GenericStepOutput({
                type: stepOutput.type,
                status: stepOutput.status,
                input: stepOutput.input,
                output: sliced?.ref ?? stepOutput.output,
                kind: sliced ? 'slice' : undefined,
                duration: stepOutput.duration,
                errorMessage: stepOutput.errorMessage,
            })
        }
        const steps = executionJournal.upsertStep({ stepName, stepOutput: finalized, path: this.currentPath.path, steps: this.steps })
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

    public async currentState(referencedStepNames?: string[]): Promise<Record<string, unknown>> {
        const referencedSteps = referencedStepNames
            ? referencedStepNames.reduce((acc, stepName) => {
                if (this.steps[stepName]) acc[stepName] = this.steps[stepName]
                return acc
            }, {} as Record<string, StepOutput>)
            : this.steps

        let flattenedSteps: Record<string, unknown> = await materializeSteps(referencedSteps, this.engineApi)
        let targetMap = this.steps

        for (const [stepName, iteration] of this.currentPath.path) {
            const stepOutput = targetMap[stepName]
            if (!stepOutput.output || stepOutput.type !== FlowActionType.LOOP_ON_ITEMS) {
                throw new EngineGenericError('NotInstanceOfLoopOnItemsStepOutputError', '[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
            }
            targetMap = stepOutput.output.iterations[iteration]
            flattenedSteps = {
                ...flattenedSteps,
                ...await materializeSteps(targetMap, this.engineApi),
            }
        }
        return flattenedSteps
    }
}

async function maybeSliceOutput(value: unknown, engineApi?: EngineApiConfig): Promise<{ ref: LogSliceRef } | undefined> {
    if (isNil(value) || isNil(engineApi)) {
        return undefined
    }
    const size = utils.sizeof(value)
    if (size <= SLICE_THRESHOLD_BYTES) {
        return undefined
    }
    const data = new TextEncoder().encode(JSON.stringify(value))
    const { fileId, readUrl } = await engineFileApi.upload({
        apiUrl: engineApi.internalApiUrl,
        engineToken: engineApi.engineToken,
        fileId: apId(),
        type: FileType.FLOW_RUN_LOG_SLICE,
        data,
    })
    return { ref: { fileId, size, url: readUrl } }
}

async function materializeStep(step: StepOutput, engineApi?: EngineApiConfig): Promise<unknown> {
    if (step.kind !== 'slice') {
        return step.output
    }
    if (isNil(engineApi)) {
        throw new EngineGenericError('MissingEngineApiConfigError', 'Cannot materialize log slice ref without engine api config')
    }
    const ref = step.output as LogSliceRef
    const existing = materializeCache.get(ref.fileId)
    if (!isNil(existing)) {
        return existing
    }
    const promise = engineFileApi.download({ apiUrl: engineApi.internalApiUrl, engineToken: engineApi.engineToken, fileId: ref.fileId })
        .then((bytes) => JSON.parse(new TextDecoder('utf-8').decode(bytes)))
    materializeCache.set(ref.fileId, promise)
    return promise
}

async function materializeSteps(steps: Record<string, StepOutput>, engineApi?: EngineApiConfig): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    for (const [stepName, step] of Object.entries(steps)) {
        result[stepName] = await materializeStep(step, engineApi)
    }
    return result
}

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

export type EngineApiConfig = {
    engineToken: string
    internalApiUrl: string
}
