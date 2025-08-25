import path from 'path'
import { GLOBAL_CACHE_FLOWS_PATH } from '@activepieces/server-shared'
import { FlowVersionId, FlowVersionState, isNil, LATEST_SCHEMA_VERSION, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState } from '../cache/cache-state'
import { ApAxiosClient } from './ap-axios'
import { engineApiService } from './server-api.service'

export const flowWorkerCache = (log: FastifyBaseLogger) => ({
    async writeFileToCacheIfCachable(flowVersionId: FlowVersionId, flow: PopulatedFlow | null): Promise<void> {
        if (isNil(flow) || flow.version.state !== FlowVersionState.LOCKED) {
            return
        }
        const flowCache = getCacheForFlow(flowVersionId)
        await flowCache.setCache(flowVersionId, JSON.stringify(flow))
    },
    async getFlow({ engineToken, flowVersionId }: GetFlowRequest): Promise<PopulatedFlow | null> {
        const cachedFlow = await getFlowFromCache(flowVersionId)
        if (!isNil(cachedFlow)) {
            return cachedFlow
        }

        try {
            const flow = await engineApiService(engineToken, log).getFlow({
                versionId: flowVersionId,
            })
            await this.writeFileToCacheIfCachable(flowVersionId, flow)
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

async function getFlowFromCache(flowVersionId: FlowVersionId): Promise<PopulatedFlow | null> {
    try {
        const flowCache = getCacheForFlow(flowVersionId)
        const cachedFlow = await flowCache.cacheCheckState(flowVersionId)
        if (isNil(cachedFlow)) {
            return null
        }
        const parsedFlow = JSON.parse(cachedFlow) as PopulatedFlow
        if (parsedFlow.version.schemaVersion !== LATEST_SCHEMA_VERSION) {
            return null
        }
        return parsedFlow
    }
    catch (error) {
        return null
    }
}

function getCacheForFlow(flowVersionId: string) {
    return cacheState(path.join(GLOBAL_CACHE_FLOWS_PATH, flowVersionId))
} 