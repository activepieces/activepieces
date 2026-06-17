import path from 'path'
import { type ApLogger, wideEvent } from '@activepieces/server-utils'
import { FlowVersion, FlowVersionId, FlowVersionState, isNil, LATEST_FLOW_SCHEMA_VERSION, WorkerToApiContract } from '@activepieces/shared'
import { getGlobalCacheFlowsPath } from '../cache-paths'
import { cacheState } from '../cache-state'

export const flowCache = (log: ApLogger, apiClient: WorkerToApiContract) => ({
    async getVersion({ flowVersionId }: GetFlowRequest): Promise<FlowVersion | null> {
        try {
            const cache = cacheState(path.join(getGlobalCacheFlowsPath(), flowVersionId))

            const { state, cacheHit } = await cache.getOrSetCache({
                key: flowVersionId,
                cacheMiss: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = flow === 'null' ? null : JSON.parse(flow) as FlowVersion
                    if (isNil(parsedFlow)) {
                        return false
                    }
                    return parsedFlow.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION
                },
                installFn: async () => {
                    return wideEvent.timed({
                        name: 'flowFetch',
                        fn: async () => {
                            const flowVersion = await apiClient.getFlowVersion({
                                versionId: flowVersionId,
                            })
                            log.info({
                                flowVersionId,
                                state: flowVersion?.state,
                                found: !isNil(flowVersion),
                            }, 'Fetched flow version')
                            return JSON.stringify(flowVersion)
                        },
                    })
                },
                skipSave: (flow: string) => {
                    if (isNil(flow)) {
                        return true
                    }
                    const parsedFlow = JSON.parse(flow) as FlowVersion | null
                    if (isNil(parsedFlow)) {
                        return true
                    }
                    return parsedFlow.state !== FlowVersionState.LOCKED
                },
            })

            wideEvent.set({ flowCacheHit: cacheHit })

            if (isNil(state)) {
                return null
            }
            return JSON.parse(state as string) as FlowVersion
        }
        catch (e) {
            if (e instanceof Error && 'status' in e && e.status === 404) {
                return null
            }
            throw e
        }
    },
})

type GetFlowRequest = {
    flowVersionId: FlowVersionId
}
