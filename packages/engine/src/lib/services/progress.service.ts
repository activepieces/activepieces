import crypto from 'crypto'
import { isNil, UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

let lastScheduledUpdateId: NodeJS.Timeout | null = null
let lastActionExecutionTime: number | undefined = undefined
let lastRequestHash: string | undefined = undefined
const MAXIMUM_UPDATE_THRESHOLD = 15000
const DEBOUNCE_THRESHOLD = 5000
const lock = new Mutex()
const updateLock = new Mutex()

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
    if (params.engineConstants.isTestMode) {
        return
    }
    await lock.runExclusive(async () => {
        lastActionExecutionTime = Date.now()
        const { flowExecutorContext, engineConstants } = params
        const url = new URL(`${engineConstants.internalApiUrl}v1/engine/update-run`)
        const request: UpdateRunProgressRequest = {
            runId: engineConstants.flowRunId,
            workerHandlerId: engineConstants.serverHandlerId ?? null,
            httpRequestId: engineConstants.httpRequestId ?? null,
            runDetails: await flowExecutorContext.toResponse(),
            progressUpdateType: engineConstants.progressUpdateType,
        }

        const requestHash = crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex')
        if (requestHash === lastRequestHash) {
            return
        }
        lastRequestHash = requestHash
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
    updateImmediate?: boolean
}
