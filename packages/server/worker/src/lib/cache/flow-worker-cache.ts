import path from 'path'
import { FlowVersion, FlowVersionId, FlowVersionState, isNil, LATEST_SCHEMA_VERSION } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ApAxiosClient } from '../api/ap-axios'
import { engineApiService } from '../api/server-api.service'
import { cacheState } from './cache-state'
import { GLOBAL_CACHE_FLOWS_PATH } from './worker-cache'

export const flowWorkerCache = (log: FastifyBaseLogger) => ({
    async getVersion({ engineToken, flowVersionId }: GetFlowRequest): Promise<FlowVersion | null> {
        try {
            const cache = cacheState(path.join(GLOBAL_CACHE_FLOWS_PATH, flowVersionId), log)
            
            const { state } = await cache.getOrSetCache({
                key: flowVersionId,
                cacheMiss: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = JSON.parse(flow) as FlowVersion
                    return parsedFlow.schemaVersion !== LATEST_SCHEMA_VERSION
                },
                installFn: async () => {
                    const flowVersion = await engineApiService(engineToken).getFlowVersion({
                        versionId: flowVersionId,
                    })
                    log.info({
                        message: '[flowWorkerCache] Installing flow',
                        flowVersionId,
                        state: flowVersion?.state,
                        found: !isNil(flowVersion),
                    })
                    return JSON.stringify(flowVersion)
                },
                skipSave: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = JSON.parse(flow) as FlowVersion
                    return parsedFlow.state !== FlowVersionState.LOCKED
                },
            })

            if (isNil(state)) {
                return null
            }
            const flowVersion = JSON.parse(state as string) as FlowVersion
            return flowVersion
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