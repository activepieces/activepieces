import { AiCallContext, AiUsageEnvironment, AiUsageOrigin, isNil } from '@activepieces/core-utils'
import { DEFAULT_MCP_DATA, RunEnvironment } from '@activepieces/shared'
import { lru, LRU } from 'tiny-lru'
import { distributedStore } from '../../database/redis-connections'
import { flowRunRepo } from '../../flows/flow-run/flow-run-service'
import { redisMetadataKey, RunsMetadataUpsertData } from '../../workers/job'

export const aiCallContext = {
    async forFlowRun({ flowRunId, projectId }: FlowRunRef): Promise<AiCallContext> {
        if (!aiCallContext.isRealRunId(flowRunId)) {
            return { origin: AiUsageOrigin.ACTION_RUN, environment: AiUsageEnvironment.PRODUCTION }
        }
        const run = await aiCallContext.runOf({ flowRunId, projectId })
        return {
            origin: AiUsageOrigin.FLOW_STEP,
            environment: run.environment,
            flowRunId,
            ...(isNil(run.flowId) ? {} : { flowId: run.flowId }),
        }
    },
    async runOf({ flowRunId, projectId }: FlowRunRef): Promise<RunInfo> {
        const cacheKey = `${projectId}:${flowRunId}`
        const cached = runCache.get(cacheKey)
        if (!isNil(cached)) {
            return cached
        }
        const info = await lookUpRun({ flowRunId, projectId })
        runCache.set(cacheKey, info)
        return info
    },
    environmentOf(environment: RunEnvironment | undefined): AiUsageEnvironment {
        return environment === RunEnvironment.TESTING ? AiUsageEnvironment.TESTING : AiUsageEnvironment.PRODUCTION
    },
    isRealRunId(flowRunId: string | undefined): flowRunId is string {
        return !isNil(flowRunId) && flowRunId.length === AP_ID_LENGTH && !PLACEHOLDER_RUN_IDS.includes(flowRunId)
    },
}

async function lookUpRun({ flowRunId, projectId }: FlowRunRef): Promise<RunInfo> {
    const queued = await distributedStore.hgetJson<RunsMetadataUpsertData>(redisMetadataKey({ projectId, runId: flowRunId }))
    if (!isNil(queued) && !isNil(queued.environment)) {
        return { flowId: queued.flowId, environment: aiCallContext.environmentOf(queued.environment) }
    }
    const saved = await flowRunRepo().findOne({ where: { id: flowRunId, projectId }, select: { flowId: true, environment: true } })
    return { flowId: saved?.flowId, environment: aiCallContext.environmentOf(saved?.environment) }
}

const AP_ID_LENGTH = 21
const PLACEHOLDER_RUN_IDS: string[] = [DEFAULT_MCP_DATA.flowRunId, 'execute-trigger', 'execute-property']
const RUN_CACHE_SIZE = 10_000
const RUN_CACHE_TTL_MS = 10 * 60 * 1000
const runCache: LRU<RunInfo> = lru(RUN_CACHE_SIZE, RUN_CACHE_TTL_MS)

type FlowRunRef = {
    flowRunId: string
    projectId: string
}

type RunInfo = {
    flowId: string | undefined
    environment: AiUsageEnvironment
}
