import path from 'path'
import { FlowVersion, FlowVersionId, FlowVersionState, isNil, LATEST_FLOW_SCHEMA_VERSION, WorkerToApiContract } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { Logger } from 'pino'
import { getGlobalCacheFlowsPath } from '../cache-paths'
import { cacheState } from '../cache-state'

const tracer = trace.getTracer('flow-cache')

export const flowCache = (log: Logger, apiClient: WorkerToApiContract) => ({
    async getVersion({ flowVersionId }: GetFlowRequest): Promise<FlowVersion | null> {
        try {
            const cache = cacheState(path.join(getGlobalCacheFlowsPath(), flowVersionId))

            const { state } = await cache.getOrSetCache({
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
                    return tracer.startActiveSpan('flowCache.fetchVersion', async (span) => {
                        try {
                            span.setAttribute('flow.versionId', flowVersionId)
                            const flowVersion = await apiClient.getFlowVersion({
                                versionId: flowVersionId,
                            })
                            log.info({
                                flowVersionId,
                                state: flowVersion?.state,
                                found: !isNil(flowVersion),
                            }, 'Fetched flow version')
                            return JSON.stringify(flowVersion)
                        }
                        finally {
                            span.end()
                        }
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

            if (isNil(state)) {
                return null
            }
            return JSON.parse(state as string) as FlowVersion
        }
        catch (e) {
            if (e instanceof Error && 'status' in e && (e as unknown as { status: number }).status === 404) {
                return null
            }
            throw e
        }
    },
})

type GetFlowRequest = {
    flowVersionId: FlowVersionId
}
