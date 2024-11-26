import crypto from 'crypto'
import { isNil, logSerializer, StepOutput, UpdateRunProgressRequest, UpdateRunProgressResponse } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import fetchRetry from 'fetch-retry'

let lastScheduledUpdateId: NodeJS.Timeout | null = null
let lastActionExecutionTime: number | undefined = undefined
let lastRequestHash: string | undefined = undefined
const MAXIMUM_UPDATE_THRESHOLD = 15000
const DEBOUNCE_THRESHOLD = 5000
const lock = new Mutex()
const updateLock = new Mutex()
const fetchWithRetry = fetchRetry(global.fetch)

export const progressService = {
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        return updateLock.runExclusive(async () => {
            if (lastScheduledUpdateId) {
                clearTimeout(lastScheduledUpdateId)
            }

            const shouldUpdateNow = isNil(lastActionExecutionTime) || (Date.now() - lastActionExecutionTime > MAXIMUM_UPDATE_THRESHOLD)
            if (shouldUpdateNow || params.updateImmediate) {
                await sendUpdateRunRequest(params)
                return
            }

            lastScheduledUpdateId = setTimeout(async () => {
                await sendUpdateRunRequest(params)
            }, DEBOUNCE_THRESHOLD)
        })
    },
}

const sendUpdateRunRequest = async (params: UpdateStepProgressParams): Promise<void> => {
    if (params.engineConstants.isRunningApTests) {
        return
    }
    await lock.runExclusive(async () => {
        lastActionExecutionTime = Date.now()
        const { flowExecutorContext, engineConstants } = params
        const runDetails = await flowExecutorContext.toResponse()
        const runDetailsWithoutSteps = { ...runDetails, steps: undefined }
        const executionState = await logSerializer.serialize({
            executionState: {
                steps: runDetails.steps as Record<string, StepOutput>,
            },
        })
        const request = {
            runId: engineConstants.flowRunId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            runDetails: runDetailsWithoutSteps,
            executionStateBuffer: executionState.toString(),
            executionStateContentLength: executionState.byteLength,
            progressUpdateType: engineConstants.progressUpdateType,
        }
        const requestHash = crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex')
        if (requestHash === lastRequestHash) {
            return
        }
        lastRequestHash = requestHash

     
        const response = await sendProgressUpdate(params.engineConstants, request)

        if (response.ok) {
            const responseBody: UpdateRunProgressResponse = await response.json()
            if (responseBody.uploadUrl) {
                await uploadExecutionState(responseBody.uploadUrl, request.executionStateBuffer)
            }
            return
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

const uploadExecutionState = async (uploadUrl: string, executionState: string): Promise<void> => {
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
