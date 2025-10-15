import path from 'path'
import { FlowVersionId, FlowVersionState, isNil, LATEST_SCHEMA_VERSION, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ApAxiosClient } from '../api/ap-axios'
import { engineApiService } from '../api/server-api.service'
import { cacheState } from './cache-state'
import { GLOBAL_CACHE_FLOWS_PATH } from './worker-cache'

export const flowWorkerCache = (log: FastifyBaseLogger) => ({
    async getFlow({ engineToken, flowVersionId }: GetFlowRequest): Promise<PopulatedFlow | null> {
        try {
            const cache = cacheState(path.join(GLOBAL_CACHE_FLOWS_PATH, flowVersionId), log)
            
            const { state } = await cache.getOrSetCache({
                key: flowVersionId,
                cacheMiss: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = JSON.parse(flow) as PopulatedFlow
                    return parsedFlow.version.schemaVersion !== LATEST_SCHEMA_VERSION
                },
                installFn: async () => {
                    const flow = await engineApiService(engineToken).getFlow({
                        versionId: flowVersionId,
                    })
                    log.info({
                        message: '[flowWorkerCache] Installing flow',
                        flowVersionId,
                        state: flow?.version.state,
                        found: !isNil(flow)
                    })
                    return JSON.stringify(flow)
                },
                skipSave: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = JSON.parse(flow) as PopulatedFlow
                    return parsedFlow.version.state !== FlowVersionState.LOCKED
                },
            })

            if (isNil(state)) {
                return null
            }
            const flow = JSON.parse(state as string) as PopulatedFlow
            return flow
        }
        catch (e) {
            if (ApAxiosClient.isApAxiosError(e) && e.error.response && e.error.response.status === 404) {
                return null
            }
            throw e
        }
    },
})

type GetFlowRequest = {
    engineToken: string
    flowVersionId: FlowVersionId
}