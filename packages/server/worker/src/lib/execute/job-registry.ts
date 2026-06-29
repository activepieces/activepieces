import { JobData, WorkerJobType } from '@activepieces/shared'
import { eventDestinationJob } from './jobs/event-destination'
import { executeFlowJob } from './jobs/execute-flow'
import { executePollingJob } from './jobs/execute-polling'
import { executePropertyJob } from './jobs/execute-property'
import { executeTokenRefreshJob } from './jobs/execute-token-refresh'
import { executeTriggerHookJob } from './jobs/execute-trigger-hook'
import { executeValidationJob } from './jobs/execute-validation'
import { executeWebhookJob } from './jobs/execute-webhook'
import { extractPieceInfoJob } from './jobs/extract-piece-info'
import { renewWebhookJob } from './jobs/renew-webhook'
import { JobHandler } from './types'

export async function getHandler(jobType: WorkerJobType): Promise<JobHandler<JobData>> {
    const eager = registry[jobType]
    if (eager !== undefined) {
        return eager
    }
    const cached = lazyCache.get(jobType)
    if (cached !== undefined) {
        return cached
    }
    const loader = lazyLoaders[jobType]
    if (loader === undefined) {
        throw new Error(`No handler registered for job type ${jobType}`)
    }
    const handler = await loader()
    lazyCache.set(jobType, handler)
    return handler
}

const registry: Partial<Record<WorkerJobType, JobHandler>> = {
    [WorkerJobType.EXECUTE_FLOW]: executeFlowJob,
    [WorkerJobType.EXECUTE_POLLING]: executePollingJob,
    [WorkerJobType.EXECUTE_WEBHOOK]: executeWebhookJob,
    [WorkerJobType.RENEW_WEBHOOK]: renewWebhookJob,
    [WorkerJobType.EXECUTE_TRIGGER_HOOK]: executeTriggerHookJob,
    [WorkerJobType.EXECUTE_PROPERTY]: executePropertyJob,
    [WorkerJobType.EXECUTE_VALIDATION]: executeValidationJob,
    [WorkerJobType.EXECUTE_TOKEN_REFRESH]: executeTokenRefreshJob,
    [WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION]: extractPieceInfoJob,
    [WorkerJobType.EVENT_DESTINATION]: eventDestinationJob,
}

// Heavy handlers are loaded on first use so their dependency graph never enters worker memory unless
// such a job actually runs. The chat agent drags the whole ai-sdk cluster (@ai-sdk/*, ai, mcp) — by
// far the largest weight — so deferring its evaluation keeps a flow-only worker's idle RSS small.
const lazyLoaders: Partial<Record<WorkerJobType, () => Promise<JobHandler>>> = {
    [WorkerJobType.EXECUTE_CHAT_AGENT]: async () => (await import('./jobs/ee/chat/execute-chat-agent')).executeChatAgentJob,
}

const lazyCache = new Map<WorkerJobType, JobHandler>()
