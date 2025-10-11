import path from 'path'
import { FlowVersionId, FlowVersionState, LATEST_SCHEMA_VERSION, PopulatedFlow } from '@activepieces/shared'
import { ApAxiosClient } from '../api/ap-axios'
import { engineApiService } from '../api/server-api.service'
import { cacheState, NO_INSTALL_FN } from './cache-state'
import { GLOBAL_CACHE_FLOWS_PATH } from './worker-cache'

export const flowWorkerCache = {
    async getFlow({ engineToken, flowVersionId }: GetFlowRequest): Promise<PopulatedFlow | null> {
        try {
            const cache = cacheState(path.join(GLOBAL_CACHE_FLOWS_PATH, flowVersionId))
            
            const { state } = await cache.getOrSetCache({
                cacheAlias: flowVersionId,
                state: async () => {
                    const flow = await engineApiService(engineToken).getFlow({
                        versionId: flowVersionId,
                    })
                    return JSON.stringify(flow)
                },
                cacheMiss: (flow: string) => {
                    const parsedFlow = JSON.parse(flow) as PopulatedFlow
                    return parsedFlow.version.schemaVersion !== LATEST_SCHEMA_VERSION
                },
                installFn: NO_INSTALL_FN,
                saveGuard: (flow: string) => {
                    const parsedFlow = JSON.parse(flow) as PopulatedFlow
                    return parsedFlow.version.state !== FlowVersionState.LOCKED
                },
            })

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
}

type GetFlowRequest = {
    engineToken: string
    flowVersionId: FlowVersionId
}