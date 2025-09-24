import crypto from 'crypto'
import { OutputContext } from '@activepieces/pieces-framework'
import { DEFAULT_MCP_DATA, FlowActionType, GenericStepOutput, isNil, logSerializer, LoopStepOutput, SendFlowResponseRequest, StepOutput, StepOutputStatus, UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { ProgressUpdateError } from '../helper/execution-errors'


let lastScheduledUpdateId: NodeJS.Timeout | null = null
let lastActionExecutionTime: number | undefined = undefined
let lastRequestHash: string | undefined = undefined
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
    sendFlowResponse: async (engineConstants: EngineConstants, request: SendFlowResponseRequest): Promise<void> => {
        await fetchWithRetry(new URL(`${engineConstants.internalApiUrl}v1/engine/update-flow-response`).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineConstants.engineToken}`,
            },
            body: JSON.stringify(request),
        })
    },
    createOutputContext: (params: CreateOutputContextParams): OutputContext => {
        const { engineConstants, flowExecutorContext, stepName, stepOutput } = params
        return {
            update: async (params: { data: unknown }) => {
                await sendUpdateRunRequest({
                    engineConstants,
                    flowExecutorContext: flowExecutorContext.upsertStep(stepName, stepOutput.setOutput(params.data)),
                    updateImmediate: true,
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
        const runDetails = await flowExecutorContext.toResponse()
        const runDetailsWithoutSteps = { ...runDetails, steps: undefined }
        const executionState = await logSerializer.serialize({
            executionState: {
                steps: runDetails.steps as Record<string, StepOutput>,
            },
        })

        if (!isNil(engineConstants.logsUploadUrl)) {
            await uploadExecutionState(engineConstants.logsUploadUrl, executionState)
        }

        const request = {
            runId: engineConstants.flowRunId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            runDetails: runDetailsWithoutSteps,
            executionStateBuffer: !isNil(engineConstants.logsUploadUrl) ? undefined : executionState.toString(),
            executionStateContentLength: executionState.byteLength,
            progressUpdateType: engineConstants.progressUpdateType,
            failedStepName: extractFailedStepName(runDetails.steps as Record<string, StepOutput>),
            logsFileId: engineConstants.logsFileId,
            testSingleStepMode: engineConstants.testSingleStepMode,
        }
        const requestHash = crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex')
        if (requestHash === lastRequestHash) {
            return
        }
        lastRequestHash = requestHash
        const response = await sendProgressUpdate(params.engineConstants, request)
        if (!response.ok) {
            throw new ProgressUpdateError('Failed to send progress update', response)
        }

    })
}

const sendProgressUpdate = async (engineConstants: EngineConstants, request: UpdateRunProgressRequest): Promise<Response> => {
    return fetchWithRetry(new URL(`${engineConstants.internalApiUrl}v1/engine/update-run`).toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineConstants.engineToken}`,
        },
        retryDelay: 4000,
        retries: 3,
        body: JSON.stringify(request),
    })
}

const uploadExecutionState = async (uploadUrl: string, executionState: Buffer): Promise<void> => {

    await fetchWithRetry(uploadUrl, {
        method: 'PUT',
        body: executionState,
        headers: {
            'Content-Type': 'application/octet-stream',
        },
        retries: 3,
        retryDelay: 3000,
    })
}


type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    updateImmediate?: boolean
}

export const extractFailedStepName = (steps: Record<string, StepOutput>): string | undefined => {
    if (!steps) {
        return undefined
    }

    const failedStep = Object.entries(steps).find(([_, step]) => {
        const stepOutput = step as StepOutput
        if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
            const loopOutput = stepOutput as LoopStepOutput
            return loopOutput.output?.iterations.some(iteration =>
                Object.values(iteration).some(iterationStep =>
                    (iterationStep as StepOutput).status === StepOutputStatus.FAILED,
                ),
            )
        }
        return stepOutput.status === StepOutputStatus.FAILED
    })

    return failedStep?.[0]
}
