import { Readable } from 'node:stream'
import { createZstdCompress } from 'node:zlib'
import { setTimeout } from 'timers/promises'
import { isNil, tryCatch } from '@activepieces/core-utils'
import { OutputContext } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, EngineGenericError, FileCompression, FileType, FLOW_RUN_LOG_MANIFEST_V2, FlowActionType, isFlowRunStateTerminal, LoopStepResult, RunEnvironment, StepOutput, StepOutputStatus, StepRunResponse, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { engineFileApi } from '../api/engine-file-api'
import { engineRunApi } from '../api/engine-run-api'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { utils } from '../utils'
import { runStateStore } from './run-state-store'


const stateLock = new Mutex()
const LOG_UPLOAD_ATTEMPTS = 3

const SNAPSHOT_FLUSH_INTERVAL_MS = 15000
let latestUpdateParams: UpdateStepProgressParams | null = null
let savedStartTime: string | null = null
let flushController: AbortController | null = null
let flushLoopPromise: Promise<void> | null = null

export const flowRunProgressReporter = {
    init: (): void => {
        if (flushController) {
            return
        }
        flushController = new AbortController()
        flushLoopPromise = runFlushLoop(flushController.signal)
    },
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        return stateLock.runExclusive(async () => {
            const { engineConstants, flowExecutorContext, stepNameToUpdate } = params
            if (params.startTime) {
                savedStartTime = params.startTime
            }
            latestUpdateParams = params
            if (!stepNameToUpdate || !engineConstants.isTestFlow) { // live runs are updated by backup job
                return
            }
            const step = flowExecutorContext.getStepOutput(stepNameToUpdate)
            if (isNil(step)) {
                return
            }
            await sendUpdateProgress({
                engineConstants,
                request: {
                    step: {
                        name: stepNameToUpdate,
                        path: flowExecutorContext.currentPath.path,
                        output: step,
                    },
                    flowRun: {
                        projectId: engineConstants.projectId,
                        flowId: engineConstants.flowId,
                        flowVersionId: engineConstants.flowVersionId,
                        id: engineConstants.flowRunId,
                        created: dayjs().toISOString(),
                        updated: dayjs().toISOString(),
                        status: flowExecutorContext.verdict.status,
                        environment: engineConstants.runEnvironment ?? RunEnvironment.TESTING,
                        failParentOnFailure: false,
                        triggeredBy: engineConstants.triggerPieceName,
                        tags: Array.from(flowExecutorContext.tags),
                        startTime: params.startTime,
                    },
                },
            })
        })
    },
    createOutputContext: (params: CreateOutputContextParams): OutputContext => {
        const { engineConstants } = params
        return {
            update: async (params: { data: unknown }) => {
                // Streaming output is best-effort — a failed push must never fail the run.
                const { error } = await tryCatch(() => engineRunApi.updateStepProgress({
                    apiUrl: engineConstants.internalApiUrl,
                    engineToken: engineConstants.engineToken,
                    request: {
                        projectId: engineConstants.projectId,
                        runId: engineConstants.flowRunId,
                        output: params.data,
                    },
                }))
                if (error) {
                    console.error('[Progress] Failed to stream step progress', error)
                }
            },
        }
    },
    backup: async (): Promise<void> => {
        await stateLock.runExclusive(async () => {
            const params = latestUpdateParams
            if (isNil(params)) {
                return
            }
            const { flowExecutorContext, engineConstants } = params
            if (engineConstants.flowRunId === DEFAULT_MCP_DATA.flowRunId) {
                return
            }
            const status = flowExecutorContext.verdict.status
            const isTerminal = isFlowRunStateTerminal({ status, ignoreInternalError: false })

            const logsFileId = engineConstants.logsFileId
            if (isNil(logsFileId)) {
                throw new EngineGenericError('LogsFileIdNotSetError', 'Logs file id is not set')
            }
            await uploadLogsFromStore({ engineConstants, flowExecutorContext, logsFileId })

            const stepResponse = extractStepResponse({
                flowExecutorContext,
                runId: engineConstants.flowRunId,
                stepName: engineConstants.stepNameToTest,
            })

            const request: UploadRunLogsRequest = {
                runId: engineConstants.flowRunId,
                projectId: engineConstants.projectId,
                status,
                streamStepProgress: engineConstants.streamStepProgress,
                logsFileId: engineConstants.logsFileId,
                failedStep: 'failedStep' in flowExecutorContext.verdict ? flowExecutorContext.verdict.failedStep : undefined,
                stepNameToTest: engineConstants.stepNameToTest,
                stepResponse,
                startTime: savedStartTime ?? undefined,
                finishTime: isTerminal ? dayjs().toISOString() : undefined,
                tags: Array.from(flowExecutorContext.tags),
                stepsCount: flowExecutorContext.stepsCount,
            }
            await sendLogsUpdate({ engineConstants, request })
        })
    },
    shutdown: async () => {
        if (!flushController) {
            return
        }

        flushController.abort()

        if (flushLoopPromise) {
            await flushLoopPromise
        }

        flushController = null
        flushLoopPromise = null
        latestUpdateParams = null
        savedStartTime = null
    },
}

process.on('SIGTERM', () => void flowRunProgressReporter.shutdown())
process.on('SIGINT', () => void flowRunProgressReporter.shutdown())

async function runFlushLoop(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
        const { error: flushError } = await tryCatch(() => flowRunProgressReporter.backup())
        if (flushError) {
            console.error('[Progress] Snapshot flush failed', flushError)
        }

        // sleep aborted → loop will exit naturally on the next signal check
        await tryCatch(() => setTimeout(SNAPSHOT_FLUSH_INTERVAL_MS, undefined, { signal }))
    }
}

const sendUpdateProgress = async ({ engineConstants, request }: SendUpdateProgressParams): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() =>
        engineRunApi.updateRunProgress({
            apiUrl: engineConstants.internalApiUrl,
            engineToken: engineConstants.engineToken,
            request,
        }),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send updateRunProgress', result.error)
    }
}

const sendLogsUpdate = async ({ engineConstants, request }: SendLogsUpdateParams): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() =>
        engineRunApi.uploadRunLog({
            apiUrl: engineConstants.internalApiUrl,
            engineToken: engineConstants.engineToken,
            request,
        }),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send uploadRunLog', result.error)
    }
}

const extractStepResponse = (params: ExtractStepResponse): StepRunResponse | undefined => {
    if (isNil(params.stepName)) {
        return undefined
    }

    const stepOutput = params.flowExecutorContext.getStepOutput(params.stepName)
    if (isNil(stepOutput)) {
        return undefined
    }
    const isSuccess = stepOutput.status === StepOutputStatus.SUCCEEDED || stepOutput.status === StepOutputStatus.PAUSED
    return {
        runId: params.runId,
        success: isSuccess,
        input: stepOutput.input,
        output: stepOutput.output,
        standardError: isSuccess ? '' : (stepOutput.errorMessage ?? ''),
        standardOutput: '',
    }
}

async function uploadLogsFromStore({ engineConstants, flowExecutorContext, logsFileId }: UploadLogsFromStoreParams): Promise<void> {
    let lastError: unknown
    for (let attempt = 0; attempt < LOG_UPLOAD_ATTEMPTS; attempt++) {
        const compressed = Readable.from(streamExecutionOutputFile(flowExecutorContext)).pipe(createZstdCompress())
        const { error } = await tryCatch(() => engineFileApi.upload({
            engineToken: engineConstants.engineToken,
            apiUrl: engineConstants.internalApiUrl,
            fileId: logsFileId,
            type: FileType.FLOW_RUN_LOG,
            compression: FileCompression.ZSTD,
            data: compressed,
        }))
        if (isNil(error)) {
            return
        }
        lastError = error
    }
    throw lastError
}

function* streamExecutionOutputFile(flowExecutorContext: FlowExecutorContext): Generator<string> {
    yield `{"version":${FLOW_RUN_LOG_MANIFEST_V2},"executionState":{"steps":`
    yield* streamSteps(flowExecutorContext.steps, [])
    yield `,"tags":${JSON.stringify(Array.from(flowExecutorContext.tags))}}}`
}

function* streamSteps(steps: Readonly<Record<string, StepOutput>>, pathPrefix: Array<[string, number]>): Generator<string> {
    yield '{'
    let first = true
    for (const [name, step] of Object.entries(steps)) {
        yield `${first ? '' : ','}${JSON.stringify(name)}:`
        first = false
        if (step.type === FlowActionType.LOOP_ON_ITEMS && !isNil(step.output)) {
            yield* streamLoopStep({ step, output: step.output, name, pathPrefix })
        }
        else {
            yield runStateStore.getStepOutputJson({ name, stepPath: JSON.stringify(pathPrefix) }) ?? JSON.stringify(step)
        }
    }
    yield '}'
}

function* streamLoopStep({ step, output, name, pathPrefix }: StreamLoopStepParams): Generator<string> {
    const { output: _omitted, ...shell } = step
    yield `${JSON.stringify(shell).slice(0, -1)},"output":`
    const scalars = JSON.stringify({ item: output.item, index: output.index }).slice(1, -1)
    yield scalars.length > 0 ? `{${scalars},"iterations":[` : '{"iterations":['
    for (let iteration = 0; iteration < output.iterations.length; iteration++) {
        if (iteration > 0) {
            yield ','
        }
        yield* streamSteps(output.iterations[iteration], [...pathPrefix, [name, iteration]])
    }
    yield ']}}'
}

type UploadLogsFromStoreParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    logsFileId: string
}

type StreamLoopStepParams = {
    step: StepOutput
    output: LoopStepResult
    name: string
    pathPrefix: Array<[string, number]>
}

type SendUpdateProgressParams = {
    engineConstants: EngineConstants
    request: UpdateRunProgressRequest
}

type SendLogsUpdateParams = {
    engineConstants: EngineConstants
    request: UploadRunLogsRequest
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepNameToUpdate?: string
    startTime?: string
}

type CreateOutputContextParams = {
    engineConstants: EngineConstants
}

type ExtractStepResponse = {
    flowExecutorContext: FlowExecutorContext
    runId: string
    stepName?: string
}
