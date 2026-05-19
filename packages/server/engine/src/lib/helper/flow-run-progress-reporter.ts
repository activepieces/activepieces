import { promisify } from 'node:util'
import { zstdCompress as zstdCompressCallback } from 'node:zlib'
import { setTimeout } from 'timers/promises'
import { OutputContext } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, EngineGenericError, FileCompression, FileType, FlowActionType, GenericStepOutput, isFlowRunStateTerminal, isNil, logSerializer, RunEnvironment, StepOutputStatus, StepRunResponse, tryCatch, UpdateRunProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { engineFileApi } from '../engine-file-api'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { utils } from '../utils'
import { workerSocket } from '../worker-socket'


const zstdCompress = promisify(zstdCompressCallback)
const stateLock = new Mutex()

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
            })
        })
    },
    createOutputContext: (params: CreateOutputContextParams): OutputContext => {
        const { engineConstants, flowExecutorContext, stepName, stepOutput } = params
        return {
            update: async (params: { data: unknown }) => {
                const updated = await flowExecutorContext
                    .upsertStep(stepName, stepOutput.setOutput(params.data))

                const stepResponse = extractStepResponse({
                    flowExecutorContext: updated,
                    runId: engineConstants.flowRunId,
                    stepName,
                })
                if (stepResponse) {
                    await workerSocket.getWorkerClient().updateStepProgress({
                        projectId: engineConstants.projectId,
                        stepResponse: {
                            ...stepResponse,
                            output: params.data,
                        },
                    })
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

            const serialized = await logSerializer.serialize({
                executionState: {
                    steps: flowExecutorContext.steps,
                    tags: Array.from(flowExecutorContext.tags),
                },
            })
            const executionState = await zstdCompress(serialized)

            const logsFileId = engineConstants.logsFileId
            if (isNil(logsFileId)) {
                throw new EngineGenericError('LogsFileIdNotSetError', 'Logs file id is not set')
            }
            await engineFileApi.upload({
                engineToken: engineConstants.engineToken,
                apiUrl: engineConstants.internalApiUrl,
                fileId: logsFileId,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.ZSTD,
                data: executionState,
            })

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
            await sendLogsUpdate(request)
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

const sendUpdateProgress = async (request: UpdateRunProgressRequest): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() =>
        workerSocket.getWorkerClient().updateRunProgress(request),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send updateRunProgress', result.error)
    }
}

const sendLogsUpdate = async (request: UploadRunLogsRequest): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() =>
        workerSocket.getWorkerClient().uploadRunLog(request),
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
        standardError: isSuccess ? '' : (stepOutput.errorMessage as string),
        standardOutput: '',
    }
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepNameToUpdate?: string
    startTime?: string
}

type CreateOutputContextParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepName: string
    stepOutput: GenericStepOutput<FlowActionType.PIECE, unknown>
}

type ExtractStepResponse = {
    flowExecutorContext: FlowExecutorContext
    runId: string
    stepName?: string
}
