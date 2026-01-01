import { OutputContext } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, EngineGenericError, EngineSocketEvent, FlowActionType, FlowRunStatus, GenericStepOutput, isFlowRunStateTerminal, isNil, logSerializer, StepOutput, StepOutputStatus, StepRunResponse, UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { utils } from '../utils'
import { workerSocket } from '../worker-socket'


let lastScheduledUpdateId: NodeJS.Timeout | null = null
let lastActionExecutionTime: number | undefined = undefined
let isGraceShutdownSignalReceived = false
const MAXIMUM_UPDATE_THRESHOLD = 15000
const DEBOUNCE_THRESHOLD = 5000
const lock = new Mutex()
const updateLock = new Mutex()
const fetchWithRetry = fetchRetry(global.fetch)

process.on('SIGTERM', () => {
    isGraceShutdownSignalReceived = true
})

process.on('SIGINT', () => {
    isGraceShutdownSignalReceived = true
})

export const progressService = {
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        return updateLock.runExclusive(async () => {
            if (lastScheduledUpdateId) {
                clearTimeout(lastScheduledUpdateId)
            }

            const shouldUpdateNow = isNil(lastActionExecutionTime) || (Date.now() - lastActionExecutionTime > MAXIMUM_UPDATE_THRESHOLD) || isGraceShutdownSignalReceived
            if (shouldUpdateNow || params.updateImmediate) {
                await sendUpdateRunRequest(params)
                return
            }

            lastScheduledUpdateId = setTimeout(async () => {
                await sendUpdateRunRequest(params)
            }, DEBOUNCE_THRESHOLD)
        })
    },
    createOutputContext: (params: CreateOutputContextParams): OutputContext => {
        const { engineConstants, flowExecutorContext, stepName, stepOutput } = params
        return {
            update: async (params: { data: unknown }) => {
                const trimmedSteps = await flowExecutorContext
                    .upsertStep(stepName, stepOutput.setOutput(params.data))
                    .trimmedSteps()
                const stepResponse = extractStepResponse({
                    steps: trimmedSteps,
                    runId: engineConstants.flowRunId,
                    stepName,
                })
                await workerSocket.sendToWorkerWithAck(EngineSocketEvent.UPDATE_STEP_PROGRESS, {
                    projectId: engineConstants.projectId,
                    stepResponse,
                })
            },
        }
    },
}

type CreateOutputContextParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    stepName: string
    stepOutput: GenericStepOutput<FlowActionType.PIECE, unknown>
}

const queueUpdates: UpdateStepProgressParams[] = []

const sendUpdateRunRequest = async (updateParams: UpdateStepProgressParams): Promise<void> => {
    const isRunningMcp = updateParams.engineConstants.flowRunId === DEFAULT_MCP_DATA.flowRunId
    if (updateParams.engineConstants.isRunningApTests || isRunningMcp) {
        return
    }
    queueUpdates.push(updateParams)
    await lock.runExclusive(async () => {
        const params = queueUpdates.pop()
        while (queueUpdates.length > 0) {
            queueUpdates.pop()
        }
        if (isNil(params)) {
            return
        }
        lastActionExecutionTime = Date.now()
        const { flowExecutorContext, engineConstants } = params
        const trimmedSteps = await flowExecutorContext.trimmedSteps()
        const executionState = await logSerializer.serialize({
            executionState: {
                steps: trimmedSteps,
            },
        })
        if (isNil(engineConstants.logsUploadUrl)) {
            throw new EngineGenericError('LogsUploadUrlNotSetError', 'Logs upload URL is not set')
        }
        const uploadLogResponse = await uploadExecutionState(engineConstants.logsUploadUrl, executionState)
        if (!uploadLogResponse.ok) {
            throw new EngineGenericError('ProgressUpdateError', 'Failed to upload execution state', uploadLogResponse)
        }

        const stepResponse = extractStepResponse({
            steps: trimmedSteps,
            runId: engineConstants.flowRunId,
            stepName: engineConstants.stepNameToTest,
        })

        const request: UpdateRunProgressRequest = {
            runId: engineConstants.flowRunId,
            projectId: engineConstants.projectId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            status: flowExecutorContext.verdict.status,
            progressUpdateType: engineConstants.progressUpdateType,
            logsFileId: engineConstants.logsFileId,
            failedStep: flowExecutorContext.verdict.status === FlowRunStatus.FAILED ? flowExecutorContext.verdict.failedStep : undefined,
            stepNameToTest: engineConstants.stepNameToTest,
            stepResponse,
            pauseMetadata: flowExecutorContext.verdict.status === FlowRunStatus.PAUSED ? flowExecutorContext.verdict.pauseMetadata : undefined,
            finishTime: isFlowRunStateTerminal({
                status: flowExecutorContext.verdict.status,
                ignoreInternalError: false,
            }) ? dayjs().toISOString() : undefined,
            tags: Array.from(flowExecutorContext.tags),
            stepsCount: flowExecutorContext.stepsCount,
        }

   
        await sendProgressUpdate(request)

    })
}

const sendProgressUpdate = async (request: UpdateRunProgressRequest): Promise<void> => {
    const result = await utils.tryCatchAndThrowOnEngineError(() => 
        workerSocket.sendToWorkerWithAck(EngineSocketEvent.UPDATE_RUN_PROGRESS, request),
    )
    if (result.error) {
        throw new EngineGenericError('ProgressUpdateError', 'Failed to send progress update', result.error)
    }
}

const uploadExecutionState = async (uploadUrl: string, executionState: Buffer, followRedirects = true): Promise<Response> => {
    const response = await fetchWithRetry(uploadUrl, {
        method: 'PUT',
        body: new Uint8Array(executionState),
        headers: {
            'Content-Type': 'application/octet-stream',
        },
        redirect: 'manual',
        retries: 3,
        retryDelay: 3000,
    })

    if (followRedirects && response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')!
        return uploadExecutionState(location, executionState, false)
    }
    return response
}


const extractStepResponse = (params: ExtractStepResponse): StepRunResponse | undefined => {
    if (isNil(params.stepName)) {
        return undefined
    }

    const stepOutput = params.steps?.[params.stepName]
    const isSuccess = stepOutput?.status === StepOutputStatus.SUCCEEDED || stepOutput?.status === StepOutputStatus.PAUSED
    return {
        runId: params.runId,
        success: isSuccess,
        input: stepOutput?.input,
        output: stepOutput?.output,
        standardError: isSuccess ? '' : (stepOutput?.errorMessage as string),
        standardOutput: '',
    }
}


type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    updateImmediate?: boolean
}

type ExtractStepResponse = {
    steps: Record<string, StepOutput>
    runId: string
    stepName?: string
}
