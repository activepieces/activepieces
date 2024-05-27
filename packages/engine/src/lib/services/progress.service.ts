import { UpdateRunProgressRequest } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

const lock = new Mutex()

export const progressService = {
    sendUpdate: async (params: UpdateStepProgressParams): Promise<void> => {
        return lock.runExclusive(async () => {        
            const { flowExecutorContext, engineConstants } = params
            const url = new URL(`${EngineConstants.API_URL}v1/worker/flows/update-run`)
            const request: UpdateRunProgressRequest = {
                runId: engineConstants.flowRunId,
                workerHandlerId: engineConstants.serverHandlerId ?? null,
                runDetails: await flowExecutorContext.toResponse(),
                progressUpdateType: engineConstants.progressUpdateType,
            }

            await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${engineConstants.workerToken}`,
                },
                body: JSON.stringify(request),
            })
        })
    },
}

type UpdateStepProgressParams = {
    engineConstants: EngineConstants
    flowExecutorContext: FlowExecutorContext
}
