import crypto from 'crypto'
import { OutputContext } from '@activepieces/pieces-framework'
import { assertNotNullOrUndefined, DEFAULT_MCP_DATA, FlowActionType, GenericStepOutput, isNil, logSerializer, LoopStepOutput, SendFlowResponseRequest, StepOutput, StepOutputStatus, UpdateRunProgressRequest } from '@activepieces/shared'
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
            tasks: flowExecutorContext.tasks,
        })

        assertNotNullOrUndefined(engineConstants.logsUploadUrl, 'logsUploadUrl is required')
        const uploadLogResponse = await uploadExecutionState(engineConstants.logsUploadUrl, executionState)
        if (!uploadLogResponse.ok) {
            throw new ProgressUpdateError('Failed to upload execution state', uploadLogResponse)
        }

        const request: UpdateRunProgressRequest = {
            runId: engineConstants.flowRunId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            runDetails: runDetailsWithoutSteps,
            progressUpdateType: engineConstants.progressUpdateType,
            failedStepName: extractFailedStepName(runDetails.steps as Record<string, StepOutput>),
            logsFileId: engineConstants.logsFileId,
            stepNameToTest: engineConstants.stepNameToTest,
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

const uploadExecutionState = async (uploadUrl: string, executionState: Buffer, followRedirects = true): Promise<Response> => {
    const response = await fetchWithRetry(uploadUrl, {
        method: 'PUT',
        body: executionState,
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
