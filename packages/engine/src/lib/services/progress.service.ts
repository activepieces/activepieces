import crypto from 'crypto'
import { FileLocation, isNil, logSerializer, NotifyFrontendRequest, StepOutput, UpdateRunProgressRequest, UpdateRunProgressResponse } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { ProgressUpdateError } from '../helper/execution-errors'

const FILE_STORAGE_LOCATION = process.env.AP_FILE_STORAGE_LOCATION as FileLocation
const USE_SIGNED_URL = (process.env.AP_S3_USE_SIGNED_URLS === 'true') && FILE_STORAGE_LOCATION === FileLocation.S3

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
            executionStateBuffer: USE_SIGNED_URL ? undefined : executionState.toString(),
            executionStateContentLength: executionState.byteLength,
            progressUpdateType: engineConstants.progressUpdateType,
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
        if (USE_SIGNED_URL) {
            const responseBody: UpdateRunProgressResponse = await response.json()
            if (isNil(responseBody.uploadUrl)) {
                throw new ProgressUpdateError('Upload URL is not available', response)
            }
            await uploadExecutionState(responseBody.uploadUrl, executionState)
        }
        await notifyFrontend(engineConstants, engineConstants.flowRunId)
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

const notifyFrontend = async (engineConstants: EngineConstants, runId: string): Promise<void> => {
    const request: NotifyFrontendRequest = {
        runId,
    }
    await fetchWithRetry(new URL(`${engineConstants.internalApiUrl}v1/engine/notify-frontend`).toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineConstants.engineToken}`,
        },
        body: JSON.stringify(request),
    })
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    updateImmediate?: boolean
}
