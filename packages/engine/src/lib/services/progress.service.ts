import { isNil, UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

let timeoutId: NodeJS.Timeout | null = null
let isRequestPending = false
const INACTION_UPDATE_THRESHOLD = 4000
const ACTION_UPDATE_THRESHOLD = 15000
const lock = new Mutex()

export const progressService = {
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        resetTimeout()

        const now = Date.now()
        const { lastActionExecutionTime } = params

        if (shouldSendImmediateUpdate(lastActionExecutionTime, now)) {
            await sendUpdateRunRequest(params)
            isRequestPending = false
            return
        }

        isRequestPending = true
        scheduleUpdate(params)
    },
}

const resetTimeout = (): void => {
    if (timeoutId) {
        clearTimeout(timeoutId)
    }
}

const shouldSendImmediateUpdate = (lastActionExecutionTime: number | undefined, now: number): boolean => {
    return isNil(lastActionExecutionTime) || (now - lastActionExecutionTime > INACTION_UPDATE_THRESHOLD)
}

const scheduleUpdate = (params: UpdateStepProgressParams): void => {
    timeoutId = setTimeout(async () => {
        if (isRequestPending) {
            await sendUpdateRunRequest(params)
            isRequestPending = false
        }
    }, ACTION_UPDATE_THRESHOLD)
}

const sendUpdateRunRequest = async (params: UpdateStepProgressParams): Promise<void> => {
    await lock.runExclusive(async () => {
        const { flowExecutorContext, engineConstants } = params
        const url = new URL(`${engineConstants.internalApiUrl}v1/engine/update-run`)
        const request: UpdateRunProgressRequest = {
            runId: engineConstants.flowRunId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            runDetails: await flowExecutorContext.toResponse(),
            progressUpdateType: engineConstants.progressUpdateType,
        }

        await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineConstants.engineToken}`,
            },
            body: JSON.stringify(request),
        })
    })
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
    lastActionExecutionTime?: number
}
